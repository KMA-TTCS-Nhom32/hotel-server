import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clq7p8zx40000gg3p5hk8c8s1',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Verification code sent to email',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
