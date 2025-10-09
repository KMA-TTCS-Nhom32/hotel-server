import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class PaymentItemDto {
  @ApiProperty({ example: 'Deluxe Room' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 500000 })
  @IsNotEmpty()
  @IsNumber()
  price: number;
}

export class CreatePaymentRequestDto {
  @ApiProperty({ example: 'ORDER_123' })
  @IsNotEmpty()
  @IsNumber()
  orderCode: number;

  @ApiProperty({ example: 1000000 })
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Payment for hotel booking' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'https://your-domain.com/cancel' })
  @IsNotEmpty()
  @IsString()
  cancelUrl: string;

  @ApiProperty({ example: 'https://your-domain.com/return' })
  @IsNotEmpty()
  @IsString()
  returnUrl: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  buyerName?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsOptional()
  @IsString()
  buyerEmail?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsOptional()
  @IsString()
  buyerPhone?: string;

  @ApiPropertyOptional({ example: '123 Street' })
  @IsOptional()
  @IsString()
  buyerAddress?: string;

  @ApiPropertyOptional({ type: [PaymentItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  items?: PaymentItemDto[];
}

export class CancelPaymentRequestDto {
  @ApiProperty({ example: 'a7a9454060cd48909864b3747289ff38' })
  @IsNotEmpty()
  @IsString()
  paymentLinkId: string;

  @ApiProperty({ example: 'Cancelled by user' })
  @IsNotEmpty()
  @IsString()
  cancelReason: string;
}

export class ConfirmPaymentWebhookDto {
  @ApiProperty({ example: '00' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Success' })
  @IsNotEmpty()
  @IsString()
  desc: string;

  @ApiProperty()
  @IsNotEmpty()
  data: {
    orderCode: string;
    amount: number;
    description: string;
    accountNumber: string;
    accountName: string;
    reference: string;
    transactionId: string;
  };

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  signature: string;
}
