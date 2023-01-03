import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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

  @Get()
  findUserTransactions(@LoggedUser('id') userId: string) {
    return this.transactionService.findAllUserTransactions(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionService.findOne(id);
  }

  @HttpCode(HttpStatus.OK)
  @SkipThrottle(false)
  @Patch(':id')
  confirmTransaction(
    @Param('id', ParseUUIDPipe) transactionId: string,
    @Body() dto: TransactionOtpDto,
  ) {
    return this.transactionService.confirmTransaction(dto, transactionId);
  }
}
