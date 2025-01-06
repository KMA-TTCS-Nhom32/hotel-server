import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelBookingDto {
  @ApiProperty({
    type: String,
    example: 'Have something else to do',
    description: 'Reason for canceling the booking',
  })
  @IsNotEmpty()
  @IsString()
  cancel_reason: string;
}
