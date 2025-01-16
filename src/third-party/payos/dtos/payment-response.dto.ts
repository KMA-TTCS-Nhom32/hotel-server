import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

export class CreatePaymentResponseDto {
  @ApiProperty({ example: '970422' })
  bin: string;

  @ApiProperty({ example: '113366668888' })
  accountNumber: string;

  @ApiProperty({ example: 'QUY VAC XIN PHONG CHONG COVID' })
  accountName: string;

  @ApiProperty({ example: 3000 })
  amount: number;

  @ApiProperty({ example: 'VQRIO12546 Thanh toan iphone' })
  description: string;

  @ApiProperty({ example: 1254 })
  orderCode: string | number;

  @ApiProperty({ example: 'VND' })
  curency: string;

  @ApiProperty({ example: 'a7a9454060cd48909864b3747289ff38' })
  paymentLinkId: string;

  @ApiProperty({ example: 'PENDING' })
  status: string;

  @ApiProperty({ example: 'https://pay.payos.vn/web/a7a9454060cd48909864b3747289ff38' })
  checkoutUrl: string;

  @ApiProperty({
    example:
      '00020101021238570010A00000072701270006970422011371045208946240208QRIBFTTA5303704540430005802VN62180814TT1BQG8F khanh6304D4F6',
  })
  qrCode: string;
}

export class TransactionDto {
  @ApiProperty({ example: 'FT23212323232323' })
  reference: string;

  @ApiProperty({ example: 3000 })
  amount: number;

  @ApiProperty({ example: '113366668888' })
  accountNumber: string;

  @ApiProperty({ example: 'TTY23V15' })
  description: string;

  @ApiProperty({ example: '2023-08-01T19:44:15.000Z' })
  transactionDateTime: string;

  @ApiProperty({ example: 'NGUYEN VAN A' })
  virtualAccountName: string;

  @ApiProperty({ example: null })
  virtualAccountNumber: string | null;

  @ApiProperty({ example: null })
  counterAccountBankId: string | null;

  @ApiProperty({ example: null })
  counterAccountBankName: string | null;

  @ApiProperty({ example: null })
  counterAccountName: string | null;

  @ApiProperty({ example: null })
  counterAccountNumber: string | null;
}

export class GetPaymentResponseDto {
  @ApiProperty({ example: '10b79503da974af09761be84fd0664232' })
  id: string;

  @ApiProperty({ example: 3019 })
  orderCode: number;

  @ApiProperty({ example: 3000 })
  amount: number;

  @ApiProperty({ example: 3000 })
  amountPaid: number;

  @ApiProperty({ example: 0 })
  amountRemaining: number;

  @ApiProperty({ example: 'PAID' })
  status: string;

  @ApiProperty({ example: '2023-07-31T15:33:31.000Z' })
  createdAt: string;

  @ApiProperty({ type: [TransactionDto] })
  transactions: TransactionDto[];

  @ApiProperty({ example: null })
  cancellationReason: string | null;

  @ApiProperty({ example: null })
  canceledAt: string | null;
}

export class CancelPaymentResponseDto {
  @ApiProperty({ example: '10b79503da974af09761be84fd0664dd' })
  id: string;

  @ApiProperty({ example: 3019 })
  orderCode: number;

  @ApiProperty({ example: 3000 })
  amount: number;

  @ApiProperty({ example: 0 })
  amountPaid: number;

  @ApiProperty({ example: 3000 })
  amountRemaining: number;

  @ApiProperty({ example: 'CANCELLED' })
  status: string;

  @ApiProperty({ example: '2023-08-01T16:12:21.000Z' })
  createdAt: string;

  @ApiProperty({ type: [TransactionDto], example: [] })
  transactions: TransactionDto[];

  @ApiProperty({ example: 'Changed my mind' })
  cancellationReason: string;

  @ApiProperty({ example: '2023-08-01T17:12:21.000Z' })
  canceledAt: string;
}

export abstract class PaymentResponseDto<T> {
  code: string;
  desc: string;
  data: T;
  signature: string;

  constructor(response: any) {
    this.code = response.code;
    this.desc = response.desc;
    this.data = response.data;
    this.signature = response.signature;
  }
}

export function createPaymentResponseDto<T>(DataType: Type<T>) {
  class PaymentResponse extends PaymentResponseDto<T> {
    @ApiProperty({ example: '00' })
    declare code: string;

    @ApiProperty({ example: 'Success - Thành công' })
    declare desc: string;

    @ApiProperty({ type: DataType })
    declare data: T;

    @ApiProperty({
      example: '8d8640d802576397a1ce45ebda7f835055768ac7ad2e0bfb77f9b8f12cca4c7f',
    })
    declare signature: string;
  }

  return PaymentResponse;
}
