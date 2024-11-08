import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '@/database/database.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '@/users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ThrottlerModule } from '@nestjs/throttler';
import { TokenService } from './services/token.service';
import { LoginService } from './services/login.service';
import { RefreshTokenService } from './services/refresh-token.service';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_ACCESS_TOKEN_EXPIRED') },
      }),
    }),
    UsersModule,
    ThrottlerModule.forRoot([{
      name: 'login', // specific name for login limits
      ttl: 15 * 60 * 1000, // 15 minutes
      limit: 5, // 5 attempts
    }]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenService, LoginService, RefreshTokenService],
  exports: [AuthService],
})
export class AuthModule {}
