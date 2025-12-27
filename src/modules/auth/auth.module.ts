import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AccountLockoutService,
  CommonService,
  LoginService,
  RefreshTokenService,
  RegisterService,
  TokenService,
} from './services';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '@/database/database.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '@/modules/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ThrottlerModule } from '@nestjs/throttler';
import { VerificationModule } from '../verification/verification.module';
import { EmailModule } from '@/communication/email/email.module';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        // signOptions: {
        // Remove the expiresIn from here since we'll handle it separately for access and refresh tokens
        // expiresIn: config.get<string>('JWT_ACCESS_TOKEN_EXPIRED')
        // },
      }),
    }),
    UsersModule,
    ThrottlerModule.forRoot([
      {
        name: 'login', // specific name for login limits
        ttl: 15 * 60 * 1000, // 15 minutes
        limit: 5, // 5 attempts
      },
    ]),
    VerificationModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    CommonService,
    TokenService,
    LoginService,
    RegisterService,
    RefreshTokenService,
    AccountLockoutService,
  ],
  exports: [AuthService, AccountLockoutService],
})
export class AuthModule {}
