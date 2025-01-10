import { createPaginationDto } from '@/common/dtos';
import { Booking } from '../models';

export class BookingsPaginationResultDto extends createPaginationDto(Booking) {}
