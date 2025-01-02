import { HotelRoomStatus } from '@prisma/client';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateHotelRoomDto {
  @ApiProperty({
    type: String,
    example: 'Deluxe Room',
    description: "Hotel Room's name",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    example: 'deluxe-room',
    description: "Hotel Room's slug",
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    enum: HotelRoomStatus,
    example: HotelRoomStatus.AVAILABLE,
    description: "Hotel Room's status",
  })
  @IsEnum(HotelRoomStatus)
  @IsNotEmpty()
  status: HotelRoomStatus;

  @ApiProperty({
    type: String,
    example: 'detail-id-123',
    description: 'ID of the room detail',
  })
  @IsString()
  @IsNotEmpty()
  detailId: string;
}

export class UpdateHotelRoomDto extends PartialType(CreateHotelRoomDto) {}
