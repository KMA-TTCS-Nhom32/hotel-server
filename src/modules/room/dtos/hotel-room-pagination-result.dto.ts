import { createPaginationDto } from '@/common/dtos';
import { HotelRoom } from '../models';

export class HotelRoomPaginationResultDto extends createPaginationDto(HotelRoom) {}
