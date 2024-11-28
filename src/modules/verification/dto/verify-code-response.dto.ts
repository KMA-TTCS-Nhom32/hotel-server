import { ApiProperty } from '@nestjs/swagger';
import { AccountIdentifier } from '@prisma/client';

export class VerifyCodeResponseDto {
  @ApiProperty({
    description: 'Verification status',
    example: true
  })
  success: boolean;

  @ApiProperty({
    description: 'User ID',
    example: 'user123'
  })
  userId: string;

  @ApiProperty({
    description: 'Type of verification',
    enum: AccountIdentifier,
    example: AccountIdentifier.EMAIL
  })
  type: AccountIdentifier;
}
