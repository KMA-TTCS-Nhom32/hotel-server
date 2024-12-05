import { ApiProperty } from '@nestjs/swagger';
import { ActiveSession } from '../types';

export class SessionResponseDto {
  @ApiProperty({
    description: 'List of active user sessions',
    type: Array<ActiveSession>,
  })
  sessions: ActiveSession[];
}

export class RevokeSessionResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Session revoked successfully',
  })
  message: string;
}

export class LogoutResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Logged out successfully',
  })
  message: string;
}
