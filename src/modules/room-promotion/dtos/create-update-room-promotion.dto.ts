import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { BookingType, DiscountType } from '@prisma/client';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PromotionTranslationDto } from './translation.dto';
import { Type } from 'class-transformer';

@ValidatorConstraint({ name: 'dateRange', async: false })
class DateRangeValidator implements ValidatorConstraintInterface {
  validate(end_date: Date, args: any) {
    const start_date = args.object.start_date;
    return start_date && end_date && new Date(start_date) < new Date(end_date);
  }

  defaultMessage() {
    return 'End date must be after start date';
  }
}

export class CreateRoomPromotionDto {
  @ApiProperty({
    example: 'SUMMER2025',
    description: 'Unique code for the promotion',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z0-9-_]+$/, {
    message: 'Code must be uppercase alphanumeric with optional hyphens/underscores',
  })
  code: string;

  @ApiProperty({
    example: 'Summer special discount for all luxury rooms',
    description: 'Description of the promotion',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Type of booking this promotion applies to',
    enum: BookingType,
    example: BookingType.NIGHTLY,
  })
  @IsNotEmpty()
  @IsEnum(BookingType)
  applied_type: BookingType;

  @ApiProperty({
    description: 'Type of discount (percentage or fixed amount)',
    enum: DiscountType,
    example: DiscountType.PERCENTAGE,
  })
  @IsNotEmpty()
  @IsEnum(DiscountType)
  discount_type: DiscountType;

  @ApiProperty({
    description: 'Value of the discount (percentage or fixed amount)',
    example: 15,
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.discount_type === DiscountType.PERCENTAGE)
  @Max(100, { message: 'Percentage discount cannot exceed 100%' })
  @ValidateIf((o) => o.discount_type === DiscountType.FIXED_AMOUNT)
  @IsPositive({ message: 'Fixed amount discount must be a positive number' })
  @Max(10000000, { message: 'Fixed amount discount cannot exceed 10,000,000' })
  discount_value: number;

  @ApiProperty({
    description: 'Start date of the promotion',
    type: Date,
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @ApiProperty({
    description: 'End date of the promotion',
    type: Date,
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @Validate(DateRangeValidator)
  end_date: Date;

  @ApiPropertyOptional({
    description: 'Minimum hours required for hourly booking promotion',
    example: 3,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ValidateIf((o) => o.applied_type === BookingType.HOURLY)
  min_hours?: number;

  @ApiPropertyOptional({
    description: 'Minimum nights required for nightly booking promotion',
    example: 2,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ValidateIf((o) => o.applied_type === BookingType.NIGHTLY)
  min_nights?: number;

  @ApiPropertyOptional({
    description: 'Minimum days required for daily booking promotion',
    example: 3,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @ValidateIf((o) => o.applied_type === BookingType.DAILY)
  min_days?: number;

  @ApiPropertyOptional({
    description: 'Total number of codes available for the promotion',
    example: 100,
    type: Number,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  total_code?: number;

  @ApiProperty({
    description: 'IDs of room details this promotion applies to',
    type: [String],
    example: ['clz123abc456', 'clz789def012'],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  applied_room_ids: string[];

  @ApiPropertyOptional({
    type: [PromotionTranslationDto],
    description: 'Translations for the promotion',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionTranslationDto)
  translations?: PromotionTranslationDto[];
}

export class UpdateRoomPromotionDto extends PartialType(CreateRoomPromotionDto) {}
