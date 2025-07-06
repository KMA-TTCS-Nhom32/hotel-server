import { createPaginationDto } from '@/common/dtos';
import { RoomPromotion } from '../models';

export class RoomPromotionPaginationResultDto extends createPaginationDto(RoomPromotion) {}
