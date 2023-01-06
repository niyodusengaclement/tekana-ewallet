import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, OtpDto, SigninDto } from './dto';
import * as argon from 'argon2';
import axios from 'axios';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  JWT_SECRET,
  NATIONAL_IDENTIFICATION,
  NID_VALIDATOR_URL,
} from 'src/common/constants';
import { JwtPayload } from 'src/common/interfaces';
import { OtpService } from 'src/otp/otp.service';
import { existsSync, readFile } from 'fs';
import { promisify } from 'util';
import * as path from 'path';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private otpService: OtpService,
  ) {}
  async signup(dto: AuthDto) {
    const password = await argon.hash(dto.password);
    try {
      if (dto?.country?.toLowerCase() === 'rwanda') {
        const info = await this.validateNidInfo(dto.nationalId);

        if (!info?.data?.data) {
          throw new BadRequestException(
            'National ID number was not found in the National Identification database',
          );
        }
        const { otpExpiresAt, otp, hashedOtp } =
          await this.otpService.generateOtp();

        const [user] = await Promise.all([
          this.prisma.user.create({
            data: {
              ...dto,
              email: dto.email,
              password,
              otpExpiresAt,
              otp: hashedOtp,
            },
            select: {
              id: true,
            },
          }),
          this.otpService.sendOtp(dto.phone, otp),
        ]);
        return {
          message: `We sent you an OTP on ${dto.phone}. OTP expires in 5 min`,
          data: {
            id: user.id,
          },
        };
      } else {
        const user = await this.prisma.user.create({
          data: {
            ...dto,
            email: dto.email,
            password,
            isPhoneVerified: true,
          },
          select: {
            id: true,
          },
        });
        return {
          message: 'You have successfully created an account',
          data: {
            id: user.id,
          },
        };
      }
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          const fields = error.message?.split('fields: (`')[1].split('`)')[0];
          throw new ConflictException(`${fields} already exists`);
        }
      }
      throw error;
    }
  }

  async signin(dto: SigninDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        phone: dto.phone,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const hashMatch = await argon.verify(user.password, dto.password);
    if (!hashMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (hashMatch && !user.isPhoneVerified) {
      throw new UnauthorizedException('Your phone is not verified');
    }

    const { id, firstName, lastName, email, phone } = user || {};

    const token = await this.generateToken({
      id,
      firstName,
      lastName,
      email,
      phone,
    });
    return {
      message: 'You have logged in successfully',
      data: {
        token,
      },
    };
  }

  async generateToken(payload: JwtPayload): Promise<string> {
    return await this.jwt.signAsync(payload, {
      expiresIn: '1d',
      privateKey: this.config.get(JWT_SECRET),
    });
  }

  async validateNidInfo(identificationNumber: string) {
    return await axios.get(this.config.get(NID_VALIDATOR_URL), {
      headers: {
        identificationType: NATIONAL_IDENTIFICATION,
        identificationNumber,
      },
    });
  }

  async otpVerification(dto: OtpDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        phone: dto.phone,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.isPhoneVerified) {
      throw new BadRequestException('Phone is already verified');
    }
    const hashMatch = await argon.verify(user.otp, `${dto.otp}`);
    if (new Date() > user.otpExpiresAt || !hashMatch) {
      throw new UnauthorizedException('Invalid OTP or OTP has expired');
    }
    await this.prisma.user.update({
      data: {
        isPhoneVerified: true,
      },
      where: { id: user.id },
    });
    return {
      message: 'You phone was verified successfully',
      data: {
        id: user.id,
      },
    };
  }

  async resendOtp(phone: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
    });
    if (!user) {
      throw new NotFoundException(`User with phone ${phone} was not found`);
    }
    if (user.isPhoneVerified) {
      throw new BadRequestException('Phone is already verified');
    }
    const { otpExpiresAt, otp, hashedOtp } =
      await this.otpService.generateOtp();
    await Promise.all([
      this.otpService.sendOtp(phone, otp),
      this.prisma.user.update({
        data: {
          otpExpiresAt,
          otp: hashedOtp,
        },
        where: { id: user.id },
      }),
    ]);
    return {
      message: `We sent you an OTP on ${phone}. OTP expires in 5 min`,
      data: {
        id: user.id,
      },
    };
  }

  async readLogs() {
    const pathString = path.join(__dirname, '../../../logs/errors.log');
    if (!existsSync(pathString)) {
      throw new BadRequestException('No error files was found');
    }
    const readLogsData = promisify(readFile);

    const data = await readLogsData(pathString);

    return { data: data.toString('utf-8').split('\u001b') };
  }
}
