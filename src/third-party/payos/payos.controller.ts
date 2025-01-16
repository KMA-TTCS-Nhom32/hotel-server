import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PayosService } from './payos.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreatePaymentRequestDto,
  PaymentResponseDto,
  CancelPaymentRequestDto,
  ConfirmPaymentWebhookDto,
} from './dtos';
import { RolesGuard } from '@/modules/auth/guards';
import { Roles } from '@/modules/auth/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('PayOS')
@Controller('payos')
export class PayosController {
  constructor(private readonly payosService: PayosService) {}

  @Post('payment-request')
  @ApiOperation({ summary: 'Create a new payment request' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment request created successfully',
    type: PaymentResponseDto,
  })
  createPaymentRequest(@Body() createDto: CreatePaymentRequestDto) {
    return this.payosService.createPaymentRequest(createDto);
  }

  @Post('cancel-payment')
  @ApiOperation({ summary: 'Cancel a payment link' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment cancelled successfully',
    type: PaymentResponseDto,
  })
  cancelPayment(@Body() cancelDto: CancelPaymentRequestDto) {
    return this.payosService.cancelPaymentLink(cancelDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('payment-status/:paymentLinkId')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment status retrieved successfully',
    type: PaymentResponseDto,
  })
  getPaymentStatus(@Param('paymentLinkId') paymentLinkId: string) {
    return this.payosService.getPaymentStatus(paymentLinkId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle payment confirmation webhook' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
    type: Boolean,
  })
  handleWebhook(@Body() webhookData: ConfirmPaymentWebhookDto) {
    return this.payosService.validatePaymentConfirmation(webhookData);
  }
}
