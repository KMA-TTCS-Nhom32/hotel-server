import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class DeleteUserDto {
  @ApiProperty({
    description: 'Reason for account deletion',
    required: false,
    example: 'User requested account deletion'
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
