import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RefreshThrottlerGuard extends ThrottlerGuard {
  protected limit = 3; // 3 attempts
  protected ttl = 60; // 1 minute window

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip; // Track by IP address
  }

  protected errorMessage = 'Too many refresh token attempts. Please try again later.';
}
