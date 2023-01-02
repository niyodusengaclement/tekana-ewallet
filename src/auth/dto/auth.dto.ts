import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AuthDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    type: 'string',
    default: 'Mistico',
    required: true,
  })
  firstName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    type: 'string',
    default: 'Clement',
    required: true,
  })
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    default: '120008117******',
    required: true,
  })
  nationalId: string;

  @IsEmail()
  @IsOptional()
  @ApiProperty({
    type: 'string',
    default: 'rssb@yopmail.com',
    required: false,
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    required: true,
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    default: 'Rwanda',
    required: true,
  })
  country: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    description: 'Phone number without + sign',
    required: true,
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    default: 'male',
    required: true,
  })
  gender: Gender;

  @IsDateString()
  @IsNotEmpty()
  @ApiProperty({
    type: 'string',
    required: true,
    default: new Date(),
  })
  dob: Date;
}
