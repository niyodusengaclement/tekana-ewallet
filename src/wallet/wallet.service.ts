import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletDto } from './dto';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}
  async createWallet(dto: WalletDto, userId: string) {
    try {
      const wallet = await this.prisma.wallet.create({
        data: {
          ...dto,
          // Bonus for new wallet
          balance: 5000,
          userId: userId,
        },
        select: {
          id: true,
          name: true,
          balance: true,
        },
      });
      return {
        message: 'You have successfully created a wallet',
        data: { wallet },
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `You already have a wallet with ${dto.currency} currency`,
          );
        }
      }
      throw error;
    }
  }
  async findUserWallets(userId: string) {
    try {
      const wallets = await this.prisma.wallet.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          balance: true,
          currency: true,
        },
      });
      return { data: wallets };
    } catch (error) {
      throw error;
    }
  }
  async findWalletById(walletId: string) {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { id: walletId },
        select: {
          id: true,
          name: true,
          balance: true,
          currency: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      if (!wallet) {
        throw new NotFoundException(`Wallet with id ${walletId} not found`);
      }
      return { data: wallet };
    } catch (error) {
      throw error;
    }
  }
}
