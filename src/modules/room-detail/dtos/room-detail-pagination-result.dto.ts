import { createPaginationDto } from '@/common/dtos';
import { RoomDetail } from '../models/room-detail.model';

export class RoomDetailPaginationResultDto extends createPaginationDto(RoomDetail) {}
