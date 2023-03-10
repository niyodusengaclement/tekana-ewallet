import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  Currency,
  TransactionStatus,
  TransactionType,
  Wallet,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { OtpService } from 'src/otp/otp.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TransactionDto, TransactionOtpDto } from './dto';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);
  constructor(private prisma: PrismaService, private otpService: OtpService) {}
  async transactionRequest(userId: string, phone: string, dto: TransactionDto) {
    try {
      const sourceWallet = await this.findWallet(dto.sourceWalletId);
      if (!sourceWallet) {
        throw new NotFoundException(
          `Source wallet ${dto.sourceWalletId} not found`,
        );
      }
      if (sourceWallet && sourceWallet.userId !== userId) {
        throw new NotFoundException(
          `Source wallet ${dto.sourceWalletId} not found`,
        );
      }
      const destinationWallet = await this.findWallet(dto.destinationWalletId);
      if (!destinationWallet) {
        throw new NotFoundException(
          `Destination wallet ${dto.destinationWalletId} not found`,
        );
      }
      const transactionFee = await this.calculateTransactionFee(
        dto.transactionAmount,
        dto.currency,
        dto.transactionType,
      );

      const totalTransactionAmount = dto.transactionAmount + transactionFee;

      if (sourceWallet && +sourceWallet.balance < totalTransactionAmount) {
        throw new NotFoundException(
          `You don't have enough funds to complete this transaction`,
        );
      }

      const { otpExpiresAt, otp, hashedOtp } =
        await this.otpService.generateOtp();

      const [transaction] = await Promise.all([
        this.prisma.transaction.create({
          data: {
            ...dto,
            totalTransactionAmount,
            transactionFee,
            otp: hashedOtp,
            otpExpiresAt,
            userId,
          },
        }),
        this.otpService.sendOtp(phone, otp),
      ]);

      return {
        message: `We have sent you an OTP on ${phone} to confirm transaction. OTP expires in 5 min`,
        data: {
          id: transaction.id,
          ...dto,
          totalTransactionAmount,
          transactionFee,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async findAllUserTransactions(userId: string) {
    return await this.findTransactions(true, { userId });
  }

  async findUserTransactionsByStatus(userId: string, status: string) {
    const statuses = [
      TransactionStatus.completed,
      TransactionStatus.failed,
      TransactionStatus.pending,
    ];
    if (!statuses.toLocaleString().includes(status)) {
      throw new BadRequestException(`Status should be one of ${statuses}`);
    }
    const options = {
      userId,
      transactionStatus: status,
      transactionType: TransactionType.send,
    };
    return await this.findTransactions(true, options);
  }

  async findAllReceivedTransactions(walletId: string) {
    const options = {
      destinationWalletId: walletId,
      transactionStatus: TransactionStatus.completed,
      transactionType: TransactionType.send,
    };
    return await this.findTransactions(false, options);
  }

  async findOne(transactionId: string) {
    const data = await this.prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },
      select: {
        id: true,
        transactionAmount: true,
        totalTransactionAmount: true,
        transactionFee: true,
        sourceWalletId: true,
        destinationWalletId: true,
        transactionStatus: true,
        transactionType: true,
        comment: true,
      },
    });
    if (!data) {
      throw new NotFoundException(
        `Transaction with id ${transactionId} not found`,
      );
    }
    return { data };
  }

  async findWallet(walletId: string): Promise<Wallet | null> {
    return await this.prisma.wallet.findUnique({
      where: {
        id: walletId,
      },
    });
  }
  async calculateTransactionFee(
    transactionAmount: number,
    currency: Currency,
    transactionType: TransactionType,
  ): Promise<number> {
    const fee = await this.prisma.fee.findUnique({
      where: {
        transactionType_currency: {
          transactionType,
          currency,
        },
      },
    });
    if (fee) {
      return (transactionAmount * +fee.percentageRate) / 100;
    } else {
      return 0;
    }
  }

  async confirmTransaction(dto: TransactionOtpDto, transactionId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: {
        id: transactionId,
      },
    });
    if (!transaction) {
      throw new NotFoundException(
        `Transaction with id ${transactionId} not found`,
      );
    }
    if (transaction.transactionStatus !== TransactionStatus.pending) {
      throw new ForbiddenException(
        `Transaction with id ${transactionId} is not pending`,
      );
    }
    const hashMatch = await bcrypt.compare(`${dto.otp}`, transaction.otp);
    if (
      (new Date() > transaction.otpExpiresAt || !hashMatch) &&
      dto.otp !== 123456 // For testing purpose 123456 is always valid (to be removed in production mode)
    ) {
      throw new UnauthorizedException('Invalid OTP or OTP has expired');
    }
    const data = await this.prisma.transaction.update({
      data: {
        transactionStatus: TransactionStatus.completed,
      },
      where: { id: transaction.id },
      select: {
        id: true,
        transactionAmount: true,
        totalTransactionAmount: true,
        transactionFee: true,
        sourceWalletId: true,
        destinationWalletId: true,
        transactionStatus: true,
        transactionType: true,
      },
    });

    const sourceWallet = await this.findWallet(transaction.sourceWalletId);
    if (!sourceWallet) {
      throw new NotFoundException(
        `Source wallet ${transaction.sourceWalletId} not found`,
      );
    }
    if (sourceWallet && sourceWallet.userId !== transaction.userId) {
      throw new NotFoundException(
        `Source wallet ${transaction.sourceWalletId} not found`,
      );
    }

    if (
      sourceWallet &&
      +sourceWallet.balance < +transaction.totalTransactionAmount
    ) {
      throw new NotFoundException(
        `You don't have enough funds to complete this transaction`,
      );
    }

    const wallet = await this.prisma.wallet.update({
      data: {
        balance: +sourceWallet.balance - +transaction.totalTransactionAmount,
      },
      where: { id: transaction.sourceWalletId },
    });

    return {
      message: 'Transaction completed successfully',
      data: {
        ...data,
        newWalletBalance: +wallet.balance,
      },
    };
  }

  async findTransactions(isSender: boolean, options?: object) {
    const data = await this.prisma.transaction.findMany({
      where: options || {},
      select: {
        id: true,
        transactionAmount: true,
        totalTransactionAmount: isSender,
        transactionFee: isSender,
        sourceWalletId: true,
        destinationWalletId: true,
        transactionStatus: isSender,
        transactionType: true,
        comment: true,
      },
    });
    return { data };
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    await this.prisma.transaction.updateMany({
      data: {
        transactionStatus: TransactionStatus.failed,
      },
      where: {
        otpExpiresAt: {
          lte: new Date(),
        },
        transactionStatus: TransactionStatus.pending,
      },
    });
  }
}
