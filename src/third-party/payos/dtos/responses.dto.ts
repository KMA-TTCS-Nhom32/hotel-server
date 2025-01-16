import {
  CreatePaymentResponseDto,
  GetPaymentResponseDto,
  CancelPaymentResponseDto,
  createPaymentResponseDto,
} from './payment-response.dto';

export class CreatePaymentResponse extends createPaymentResponseDto(CreatePaymentResponseDto) {}
export class GetPaymentResponse extends createPaymentResponseDto(GetPaymentResponseDto) {}
export class CancelPaymentResponse extends createPaymentResponseDto(CancelPaymentResponseDto) {}
