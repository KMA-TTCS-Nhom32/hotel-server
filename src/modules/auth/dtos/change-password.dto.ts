import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'current-password',
    description: 'The current password of the user',
    type: String,
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'new-password',
    description: 'The new password of the user',
    type: String,
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message:
      'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character',
  })
  newPassword: string;

  @ApiProperty({
    example: 'new-password',
    description: 'The confirm password of the user',
    type: String,
  })
  @IsString()
  confirmPassword: string;
}
