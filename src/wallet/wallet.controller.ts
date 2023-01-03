import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { LoggedUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { WalletDto } from './dto';
import { WalletService } from './wallet.service';

@SkipThrottle()
@ApiTags('Wallet')
@Controller('wallets')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private walletService: WalletService) {}
  @Post()
  createWallet(@Body() dto: WalletDto, @LoggedUser('id') userId: string) {
    return this.walletService.createWallet(dto, userId);
  }
  @Get()
  findUserWallets(@LoggedUser('id') userId: string) {
    return this.walletService.findUserWallets(userId);
  }
  @Get('by-id/:id')
  findWalletById(@Param('id', ParseUUIDPipe) walletId: string) {
    return this.walletService.findWalletById(walletId);
  }
}
