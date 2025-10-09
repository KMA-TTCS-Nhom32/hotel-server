import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { BookingService } from './booking.service';
import { 
  ApiExtraModels, 
  ApiOkResponse, 
  ApiOperation, 
  ApiTags,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse
} from '@nestjs/swagger';
import {
  BookingsPaginationResultDto,
  CancelBookingDto,
  CreateBookingAtHotelDto,
  CreateBookingOnlineDto,
  FilterBookingsDto,
  FilterMyBookingsDto,
  PrepareBookingDto,
  QueryBookingsDto,
  QueryMyBookingsDto,
  SortBookingsDto,
  UpdateBookingStatusDto,
} from './dtos';
import { Booking } from './models';
import { JwtUser } from '../auth/types';
import { BookingCreateType, UserRole } from '@prisma/client';
import { RolesGuard } from '../auth/guards';
import { Public, Roles } from '../auth/decorators';

@ApiTags('Booking')
@ApiExtraModels(
  QueryBookingsDto,
  FilterBookingsDto,
  SortBookingsDto,
  QueryMyBookingsDto,
  FilterMyBookingsDto,
)
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new booking online',
  })
  @ApiCreatedResponse({
    description: 'Booking has been successfully created.',
    type: Booking,
  })
  @ApiBadRequestResponse({
    description: 'Invalid booking data',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  createBookingOnline(@Req() req: Request, @Body() createDto: CreateBookingOnlineDto) {
    const user = req.user as JwtUser;

    const prepareData: PrepareBookingDto = {
      userId: user.userId,
      create_type: BookingCreateType.ONLINE_BOOKING,
    };

    return this.bookingService.createOnline(createDto, prepareData);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @Post('directly')
  @ApiOperation({
    summary: 'Create a new booking directly at the hotel',
  })
  @ApiCreatedResponse({
    description: 'Booking has been successfully created.',
    type: Booking,
  })
  @ApiBadRequestResponse({
    description: 'Invalid booking data',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  createBookingDirectly(@Req() req: Request, @Body() createDto: CreateBookingAtHotelDto) {
    const user = req.user as JwtUser;

    const prepareData: PrepareBookingDto = {
      userId: user.userId,
      create_type: BookingCreateType.AT_HOTEL,
    };

    return this.bookingService.createAtHotel(createDto, prepareData);
  }

  @Get('my-bookings')
  @ApiOperation({
    summary: 'Get all my bookings with pagination and filters',
  })
  @ApiOkResponse({
    description: 'Returns paginated bookings list',
    type: BookingsPaginationResultDto,
  })
  getMyBookings(@Req() req: Request, @Query() queryDto: QueryMyBookingsDto) {
    const user = req.user as JwtUser;
    const { page, pageSize, filters } = queryDto;

    return this.bookingService.getMyBookings(user.userId, { page, pageSize }, filters);
  }

  @Get(':bookingId')
  @ApiOperation({
    summary: 'Get booking details',
  })
  @ApiOkResponse({
    description: 'Returns booking details',
    type: Booking,
  })
  @ApiNotFoundResponse({
    description: 'Booking not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  findById(@Param('bookingId') bookingId: string) {
    return this.bookingService.findById(bookingId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get()
  @ApiOperation({
    summary: 'Get all bookings with pagination and filters',
  })
  @ApiOkResponse({
    description: 'Returns paginated bookings list',
    type: BookingsPaginationResultDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  getBookings(@Query() queryDto: QueryBookingsDto) {
    const { page, pageSize, filters, sort } = queryDto;
    return this.bookingService.findMany({ page, pageSize }, filters, sort);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Patch('update-status/:bookingId')
  @ApiOperation({
    summary: 'Update booking status',
  })
  @ApiOkResponse({
    description: 'Booking status has been successfully updated',
    type: Booking,
  })
  @ApiNotFoundResponse({
    description: 'Booking not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid status transition',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  updateBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body() updateDto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateStatus(bookingId, updateDto.status);
  }

  @Patch('cancel/:bookingId')
  @ApiOperation({
    summary: 'Cancel a booking',
  })
  @ApiOkResponse({
    description: 'Booking has been successfully canceled',
    type: Booking,
  })
  @ApiNotFoundResponse({
    description: 'Booking not found',
  })
  @ApiBadRequestResponse({
    description: 'Cannot cancel booking in current status',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  cancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() cancelDto: CancelBookingDto,
  ) {
    return this.bookingService.cancelBooking(bookingId, cancelDto);
  }

  @Public()
  @Post('webhook/payment')
  @ApiOperation({ summary: 'Handle payment webhook from PayOS' })
  async handlePaymentWebhook(@Body() webhookData: any) {
    // PayOS webhook will send data like:
    // {
    //   orderCode: "123456789",
    //   amount: 1000000,
    //   status: "PAID",
    //   description: "Payment for booking #123456789",
    //   // ... other payment details
    // }

    console.log('Received webhook data:', webhookData);

    // Check if the party sending the webhook is payos
    if (webhookData.signature === '87c1fa91ef382880d5bd7de8138c8245fb023cb85bc35628e649da457bd35811') return { success: true };

    // Extract orderId (your booking code) from the webhook data
    const orderId = String(webhookData.data.orderCode);

    // Handle the payment update
    await this.bookingService.handlePaymentWebhook(orderId, webhookData);

    return { success: true };
  }
}
