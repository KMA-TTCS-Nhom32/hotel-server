import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/users/users.service';
import { AuthErrorMessageEnum } from 'libs/common/enums';
import { compare } from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { User } from '@prisma/client';
import { JwtPayload } from './types/auth.types';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  comparePassword = async (password: string, hashPassword: string) => {
    return await compare(password, hashPassword);
  };

  async authenticate(loginDto: LoginDto) {
    const { emailOrPhone, password } = loginDto;
    const user = await this.validateLogin(emailOrPhone, password);
    
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    const accessTokenExpires = this.getTokenExpiration('JWT_ACCESS_TOKEN_EXPIRED');

    return {
      accessToken,
      accessTokenExpires,
      refreshToken,
    };
  }

  private async generateAccessToken(user: Omit<User, 'password'>) {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      identifierType: user.identifier_type,
      identifier: user[user.identifier_type.toLowerCase()], // EMAIL -> email, PHONE -> phone
    };
    return this.jwtService.sign(payload);
  }

  private async generateRefreshToken(user: Omit<User, 'password'>) {
    const payload: JwtPayload = { 
      sub: user.id,
      role: user.role,
      identifierType: user.identifier_type,
      identifier: user[user.identifier_type.toLowerCase()],
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRED'),
    });
  }

  private getTokenExpiration(configKey: string): number {
    const expiration = this.configService.get<string>(configKey) || '5m';
    const milliseconds = expiration.includes('m') 
      ? parseInt(expiration) * 60 * 1000 
      : parseInt(expiration) * 1000;
    return Date.now() + milliseconds;
  }

  private async validateLogin(emailOrPhone: string, password: string) {
    const fieldInput = this.getLoginFieldType(emailOrPhone);
    const user = await this.usersService.findOne(emailOrPhone, fieldInput);

    if (!user?.[fieldInput]) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: AuthErrorMessageEnum.WrongUsernameOrPassword,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isPasswordMatched = await this.comparePassword(password, user.password);

    if (!isPasswordMatched) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: AuthErrorMessageEnum.WrongUsernameOrPassword,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const { password: _, ...result } = user;

    return result;
  }

  private getLoginFieldType(input: string): keyof Pick<User, 'email' | 'phone'> {
    return input.includes('@') ? 'email' : 'phone';
  }
}
