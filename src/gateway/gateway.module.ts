import { Module } from '@nestjs/common';
import { PaymentGateway } from './payment.gateway';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  providers: [PaymentGateway],
  exports: [PaymentGateway],
})
export class GatewayModule {}
