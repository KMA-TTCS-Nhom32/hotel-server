import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { CancelPaymentRequestDto, CancelPaymentResponse, ConfirmPaymentWebhookDto, CreatePaymentRequestDto, CreatePaymentResponse, GetPaymentResponse } from './dtos';

@Injectable()
export class PayosService {
  private readonly logger = new Logger(PayosService.name);
  private readonly apiUrl: string;
  private readonly clientId: string;
  private readonly clientApiKey: string;
  private readonly sumKey: string;
  private readonly clientUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('PAYOS_API_URL');
    this.clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    this.clientApiKey = this.configService.get<string>('PAYOS_CLIENT_API_KEY');
    this.sumKey = this.configService.get<string>('PAYOS_CHECK_SUM_KEY');
    this.clientUrl = this.configService.get<string>('CLIENT_URL');
  }

  private generateSignature(data: CreatePaymentRequestDto): string {
    const signData = {
      amount: data.amount,
      cancelUrl: data.cancelUrl,
      description: data.description,
      orderCode: data.orderCode,
      returnUrl: data.returnUrl,
    };

    const signString = Object.keys(signData)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => `${key}=${signData[key]}`)
      .join('&');

    return createHmac('sha256', this.sumKey).update(signString).digest('hex');
  }

  private verifyWebhookSignature(data: ConfirmPaymentWebhookDto): boolean {
    const { signature, ...rest } = data;
    const signString = Object.keys(rest)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => `${key}=${JSON.stringify(rest[key])}`)
      .join('|');

    const calculatedSignature = createHmac('sha256', this.sumKey).update(signString).digest('hex');

    return calculatedSignature === signature;
  }

  async createPaymentRequest(data: CreatePaymentRequestDto): Promise<CreatePaymentResponse> {
    try {
      const signature = this.generateSignature(data);
      const paymentRequest = { ...data, signature };

      const response = await fetch(`${this.apiUrl}/v2/payment-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-client-id': this.clientId,
          'x-api-key': this.clientApiKey,
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.desc || 'Payment request failed');
      }

      return response.json();
    } catch (error) {
      this.logger.error('Failed to create payment request:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async cancelPaymentLink(data: CancelPaymentRequestDto): Promise<CancelPaymentResponse> {
    try {
      const response = await fetch(
        `${this.apiUrl}/v2/payment-requests/${data.paymentLinkId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': this.clientId,
            'x-api-key': this.clientApiKey,
          },
          body: JSON.stringify({ cancelReason: data.cancelReason }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.desc || 'Cancel payment request failed');
      }

      return response.json();
    } catch (error) {
      this.logger.error('Failed to cancel payment link:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getPaymentStatus(paymentLinkId: string): Promise<GetPaymentResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/v2/payment-requests/${paymentLinkId}`, {
        method: 'GET',
        headers: {
          'x-client-id': this.clientId,
          'x-api-key': this.clientApiKey,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.desc || 'Get payment status failed');
      }

      return response.json();
    } catch (error) {
      this.logger.error('Failed to get payment status:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  validatePaymentConfirmation(webhookData: ConfirmPaymentWebhookDto): boolean {
    if (!this.verifyWebhookSignature(webhookData)) {
      this.logger.warn('Invalid webhook signature');
      return false;
    }

    if (webhookData.code !== '00') {
      this.logger.warn(`Payment not successful: ${webhookData.desc}`);
      return false;
    }

    return true;
  }
}
