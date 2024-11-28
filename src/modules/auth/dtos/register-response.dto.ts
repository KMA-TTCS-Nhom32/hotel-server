import { ApiProperty } from '@nestjs/swagger';
import { AccountIdentifier } from '@prisma/client';

export class RegisterResponseDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "The user's email address",
    type: String || undefined,
    required: false,
  })
  email?: string;

  @ApiProperty({
    example: '+84123456789',
    description: "The user's phone number",
    type: String || undefined,
    required: false,
  })
  phone?: string;

  @ApiProperty({
    example: 'EMAIL',
    description: 'The type of identifier used for registration',
    enum: AccountIdentifier,
  })
  identifier_type: AccountIdentifier;
}
