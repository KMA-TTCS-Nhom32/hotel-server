import { Module, ValidationPipe, OnModuleInit } from '@nestjs/common';
import { APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { UsersModule } from './modules/users/users.module';
import { BranchModule } from './modules/branch/branch.module';
import { AuthModule } from './modules/auth/auth.module';
import { ImagesModule } from './modules/images/images.module';
import { AmenitiesModule } from './modules/amenities/amenities.module';

import { CloudinaryModule } from './third-party/cloudinary/cloudinary.module';

import { DatabaseModule } from './database/database.module';

import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { VerificationModule } from './modules/verification/verification.module';
import { EmailModule } from './communication/email/email.module';

import { getBullConfig } from './config';
import { ProvincesModule } from './modules/provinces/provinces.module';
import { RoomDetailModule } from './modules/room-detail/room-detail.module';
import { RoomModule } from './modules/room/room.module';
import { CleanupModule } from './common/modules/cleanup.module';
import { BookingModule } from './modules/booking/booking.module';
import { PoeditorModule } from './third-party/poeditor/poeditor.module';
import { RoomPriceHistoryModule } from './modules/room-price-history/room-price-history.module';
import { PayosModule } from './third-party/payos/payos.module';
import { GatewayModule } from './gateway/gateway.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RoomPromotionModule } from './modules/room-promotion/room-promotion.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000, // 1 minute
        limit: 5, // 5 requests per minute
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getBullConfig,
      inject: [ConfigService],
    }),
    DatabaseModule,
    CloudinaryModule,
    AuthModule,
    CleanupModule,
    UsersModule,
    AmenitiesModule,
    ProvincesModule,
    BranchModule,
    ImagesModule,
    VerificationModule,
    EmailModule,
    RoomDetailModule,
    RoomModule,
    BookingModule,
    PoeditorModule,
    RoomPriceHistoryModule,
    PayosModule,
    AnalyticsModule,
    RoomPromotionModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // Apply JWT guard globally
    },
    AppService,
    GatewayModule,
  ],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {
    console.log('Connecting to Redis Cloud...');
  }
}
