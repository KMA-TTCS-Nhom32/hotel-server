import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { BookingService } from './booking.service';
import { ApiExtraModels, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  BookingsPaginationResultDto,
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
import { Roles } from '../auth/decorators';

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
  @ApiOkResponse({
    description: 'Booking has been successfully created.',
    type: Booking,
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
  @ApiOkResponse({
    description: 'Booking has been successfully created.',
    type: Booking,
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
  updateBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body('status') updateDto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateStatus(bookingId, updateDto.status);
  }
}
