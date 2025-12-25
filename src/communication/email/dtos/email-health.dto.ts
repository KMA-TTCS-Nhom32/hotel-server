import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for email service health check
 */
export class EmailHealthResponseDto {
  @ApiProperty({
    example: 'healthy',
    description: 'Health status of the email service',
    enum: ['healthy', 'unhealthy'],
  })
  status: 'healthy' | 'unhealthy';

  @ApiProperty({
    example: true,
    description: 'Whether SMTP connection is active',
  })
  smtp: boolean;
}
