import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DeleteUserDto {
  @ApiProperty({
    description: 'Reason for deleting the user',
    example: 'User requested account deletion',
    required: true,
    minLength: 10,
  })
  @IsNotEmpty({ message: 'Reason is required' })
  @IsString({ message: 'Reason must be a string' })
  @MinLength(10, { message: 'Reason must be at least 10 characters long' })
  reason: string;
}
