import { ApiProperty } from '@nestjs/swagger';

export class ResponseWithMessage {
  @ApiProperty({
    type: Boolean,
    description: 'Indicates if the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    type: String,
    description: 'Response message',
  })
  message: string;
}
