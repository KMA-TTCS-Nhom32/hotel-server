import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingType, DiscountType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JsonTransform } from 'libs/common';
import { QueryManyWithPaginationDto, SortDto } from '@/common/dtos/filters-with-pagination.dto';
import { RoomPromotion } from '../models';

export class FilterRoomPromotionDto {
  @ApiPropertyOptional({
    description: 'Filter by promotion code',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Filter by room detail ID',
  })
  @IsOptional()
  @IsString()
  roomDetailId?: string;

  @ApiPropertyOptional({
    description: 'Filter by booking type',
    enum: BookingType,
  })
  @IsOptional()
  @IsEnum(BookingType)
  applied_type?: BookingType;

  @ApiPropertyOptional({
    description: 'Filter by discount type',
    enum: DiscountType,
  })
  @IsOptional()
  @IsEnum(DiscountType)
  discount_type?: DiscountType;

  @ApiPropertyOptional({
    description: 'Filter by active promotions (based on current date)',
    type: Boolean,
  })
  @IsOptional()
  isActive?: boolean;
}

export class SortRoomPromotionDto extends SortDto<RoomPromotion> {}

export class QueryRoomPromotionDto extends QueryManyWithPaginationDto<
  FilterRoomPromotionDto,
  SortRoomPromotionDto
> {
  @ApiPropertyOptional({
    type: String,
    description: `JSON string of ${FilterRoomPromotionDto.name}`,
  })
  @IsOptional()
  @JsonTransform(FilterRoomPromotionDto)
  @ValidateNested()
  @Type(() => FilterRoomPromotionDto)
  filters?: FilterRoomPromotionDto | null;

  @ApiPropertyOptional({
    type: String,
    description: `JSON string of ${SortRoomPromotionDto.name}`,
  })
  @IsOptional()
  @JsonTransform(SortRoomPromotionDto)
  @ValidateNested()
  @Type(() => SortRoomPromotionDto)
  sort?: SortRoomPromotionDto | null;
}
