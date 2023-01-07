import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/auth/guard';
import { LoggedUser } from 'src/auth/decorator';
import { TransactionDto, TransactionOtpDto } from './dto';
import { SkipThrottle } from '@nestjs/throttler';

@SkipThrottle()
@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  transactionRequest(
    @LoggedUser('id') userId: string,
    @LoggedUser('phone') phone: string,
    @Body() dto: TransactionDto,
  ) {
    return this.transactionService.transactionRequest(userId, phone, dto);
  }

  @Get('sent')
  findUserTransactions(@LoggedUser('id') userId: string) {
    return this.transactionService.findAllUserTransactions(userId);
  }

  @Get('sent/:status')
  findUserTransactionsByStatus(
    @LoggedUser('id') userId: string,
    @Param('status') status: string,
  ) {
    return this.transactionService.findUserTransactionsByStatus(userId, status);
  }

  @Get('received/:walletId')
  findReceivedTransactions(@Param('walletId', ParseUUIDPipe) walletId: string) {
    return this.transactionService.findAllReceivedTransactions(walletId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionService.findOne(id);
  }

  @HttpCode(HttpStatus.OK)
  @SkipThrottle(false)
  @Patch('confirm/:id')
  confirmTransaction(
    @Param('id', ParseUUIDPipe) transactionId: string,
    @Body() dto: TransactionOtpDto,
  ) {
    return this.transactionService.confirmTransaction(dto, transactionId);
  }
}
