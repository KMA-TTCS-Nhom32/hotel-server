import { Module } from '@nestjs/common';
import { PaymentGateway } from './payment.gateway';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  providers: [PaymentGateway],
  exports: [PaymentGateway],
})
export class GatewayModule {}
