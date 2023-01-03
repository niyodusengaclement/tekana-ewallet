import { ApiProperty } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class WalletDto {
  @IsString()
  @ApiProperty({
    type: 'string',
    default: 'My Wallet',
    required: true,
  })
  name: string;

  @IsString()
  @IsEnum(Currency)
  @ApiProperty({
    type: 'string',
    default: Currency.USD,
    required: true,
  })
  currency: Currency;
}
