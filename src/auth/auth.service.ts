import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto, SigninDto } from './dto';
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
        console.log({ otpExpiresAt, otp, hashedOtp });

        // const sms = await (await this.otpService.sendOtp(dto.phone, otp)).data;
        const user = await this.prisma.user.create({
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
        });
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
    const token = await this.generateToken(user);
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
}
