import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip; // Track by IP address
  }

  protected getTrackerCustomKey(req: Record<string, any>): string {
    return `login_${req.ip}`; // Custom key for login attempts
  }
}
