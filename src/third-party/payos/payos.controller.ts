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
import { 
  ApiOperation, 
  ApiTags, 
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse 
} from '@nestjs/swagger';
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
  @ApiOkResponse({
    description: 'Payment request created successfully',
    type: PaymentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid payment request data',
  })
  createPaymentRequest(@Body() createDto: CreatePaymentRequestDto) {
    return this.payosService.createPaymentRequest(createDto);
  }

  @Post('cancel-payment')
  @ApiOperation({ summary: 'Cancel a payment link' })
  @ApiOkResponse({
    description: 'Payment cancelled successfully',
    type: PaymentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid payment cancellation request',
  })
  @ApiNotFoundResponse({
    description: 'Payment link not found',
  })
  cancelPayment(@Body() cancelDto: CancelPaymentRequestDto) {
    return this.payosService.cancelPaymentLink(cancelDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('payment-status/:paymentLinkId')
  @ApiOperation({ summary: 'Get payment status' })
  @ApiOkResponse({
    description: 'Payment status retrieved successfully',
    type: PaymentResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Payment link not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  getPaymentStatus(@Param('paymentLinkId') paymentLinkId: string) {
    return this.payosService.getPaymentStatus(paymentLinkId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle payment confirmation webhook' })
  @ApiOkResponse({
    description: 'Webhook processed successfully',
    type: Boolean,
  })
  @ApiBadRequestResponse({
    description: 'Invalid webhook data',
  })
  handleWebhook(@Body() webhookData: ConfirmPaymentWebhookDto) {
    return this.payosService.validatePaymentConfirmation(webhookData);
  }
}
