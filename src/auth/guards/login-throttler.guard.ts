import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `login_${req.ip}`;  // Track login attempts by IP
  }

  protected errorMessage = 'Too many login attempts. Please try again later.';
}
