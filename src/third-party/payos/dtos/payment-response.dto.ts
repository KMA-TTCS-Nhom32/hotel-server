import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseData {
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

export class PaymentResponseDto {
  @ApiProperty({ example: '00' })
  code: string;

  @ApiProperty({ example: 'Success - Thành công' })
  desc: string;

  @ApiProperty({ type: PaymentResponseData })
  data: PaymentResponseData;

  @ApiProperty({
    example: '8d8640d802576397a1ce45ebda7f835055768ac7ad2e0bfb77f9b8f12cca4c7f',
  })
  signature: string;
}
