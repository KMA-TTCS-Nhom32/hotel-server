import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './users/users.module';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { BranchModule } from './branch/branch.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60 * 1000, // 1 minute
      limit: 5, // 5 requests per minute
    }]),
    ThrottlerModule.forRoot([{
      ttl: 60 * 1000, // 1 minute
      limit: 5, // 5 requests per minute
    }]),
    UsersModule,
    DatabaseModule,
    AuthModule,
    BranchModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,  // Apply JWT guard globally
    },
    AppService,
  ],
})
export class AppModule {}
