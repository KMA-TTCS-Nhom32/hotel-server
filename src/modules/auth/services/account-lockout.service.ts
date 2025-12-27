import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

/**
 * Configuration for account lockout
 */
export const LOCKOUT_CONFIG = {
  /** Maximum failed attempts before lockout */
  MAX_FAILED_ATTEMPTS: 5,
  /** Lockout duration in milliseconds (15 minutes) */
  LOCKOUT_DURATION_MS: 15 * 60 * 1000,
  /** Window for counting failed attempts in milliseconds (30 minutes) */
  ATTEMPT_WINDOW_MS: 30 * 60 * 1000,
  /** Cache key prefix for failed attempts */
  FAILED_ATTEMPTS_PREFIX: 'auth:failed_attempts:',
  /** Cache key prefix for lockout */
  LOCKOUT_PREFIX: 'auth:lockout:',
} as const;

export interface LockoutStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutEndsAt?: Date;
  failedAttempts: number;
}

/**
 * Service to manage account lockout after failed login attempts.
 * Uses Redis cache for temporary storage of lockout data.
 */
@Injectable()
export class AccountLockoutService {
  private readonly logger = new Logger(AccountLockoutService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  /**
   * Generates cache key for failed attempts counter
   */
  private getFailedAttemptsKey(identifier: string): string {
    return `${LOCKOUT_CONFIG.FAILED_ATTEMPTS_PREFIX}${identifier}`;
  }

  /**
   * Generates cache key for lockout status
   */
  private getLockoutKey(identifier: string): string {
    return `${LOCKOUT_CONFIG.LOCKOUT_PREFIX}${identifier}`;
  }

  /**
   * Checks if an account is currently locked out
   * @param identifier - Email or phone number
   */
  async isLocked(identifier: string): Promise<boolean> {
    try {
      const lockoutKey = this.getLockoutKey(identifier);
      const lockoutTime = await this.cache.get<number>(lockoutKey);
      return lockoutTime !== null && lockoutTime !== undefined;
    } catch (error) {
      this.logger.error(`Error checking lockout status for ${identifier}:`, error);
      return false; // Fail open to not block legitimate users
    }
  }

  /**
   * Gets the current lockout status for an account
   * @param identifier - Email or phone number
   */
  async getLockoutStatus(identifier: string): Promise<LockoutStatus> {
    try {
      const lockoutKey = this.getLockoutKey(identifier);
      const failedAttemptsKey = this.getFailedAttemptsKey(identifier);

      const [lockoutTime, failedAttempts] = await Promise.all([
        this.cache.get<number>(lockoutKey),
        this.cache.get<number>(failedAttemptsKey),
      ]);

      const currentAttempts = failedAttempts ?? 0;
      const isLocked = lockoutTime !== null && lockoutTime !== undefined;

      return {
        isLocked,
        failedAttempts: currentAttempts,
        remainingAttempts: Math.max(0, LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS - currentAttempts),
        lockoutEndsAt: isLocked ? new Date(lockoutTime) : undefined,
      };
    } catch (error) {
      this.logger.error(`Error getting lockout status for ${identifier}:`, error);
      return {
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS,
      };
    }
  }

  /**
   * Records a failed login attempt and locks the account if threshold is reached
   * @param identifier - Email or phone number
   * @returns Updated lockout status
   */
  async recordFailedAttempt(identifier: string): Promise<LockoutStatus> {
    try {
      const failedAttemptsKey = this.getFailedAttemptsKey(identifier);

      // Get current failed attempts
      const currentAttempts = (await this.cache.get<number>(failedAttemptsKey)) ?? 0;
      const newAttempts = currentAttempts + 1;

      // Update failed attempts counter
      await this.cache.set(failedAttemptsKey, newAttempts, LOCKOUT_CONFIG.ATTEMPT_WINDOW_MS);

      this.logger.warn(
        `Failed login attempt ${newAttempts}/${LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS} for ${identifier}`,
      );

      // Check if we should lock the account
      if (newAttempts >= LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS) {
        await this.lockAccount(identifier);
        this.logger.warn(`Account locked for ${identifier} after ${newAttempts} failed attempts`);
      }

      return this.getLockoutStatus(identifier);
    } catch (error) {
      this.logger.error(`Error recording failed attempt for ${identifier}:`, error);
      return {
        isLocked: false,
        failedAttempts: 0,
        remainingAttempts: LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS,
      };
    }
  }

  /**
   * Locks an account for the configured duration
   * @param identifier - Email or phone number
   */
  private async lockAccount(identifier: string): Promise<void> {
    const lockoutKey = this.getLockoutKey(identifier);
    const lockoutEndsAt = Date.now() + LOCKOUT_CONFIG.LOCKOUT_DURATION_MS;
    await this.cache.set(lockoutKey, lockoutEndsAt, LOCKOUT_CONFIG.LOCKOUT_DURATION_MS);
  }

  /**
   * Clears failed attempts and lockout for an account (called on successful login)
   * @param identifier - Email or phone number
   */
  async clearLockout(identifier: string): Promise<void> {
    try {
      const failedAttemptsKey = this.getFailedAttemptsKey(identifier);
      const lockoutKey = this.getLockoutKey(identifier);

      await Promise.all([this.cache.del(failedAttemptsKey), this.cache.del(lockoutKey)]);

      this.logger.debug(`Cleared lockout data for ${identifier}`);
    } catch (error) {
      this.logger.error(`Error clearing lockout for ${identifier}:`, error);
    }
  }

  /**
   * Manually unlock an account (admin action)
   * @param identifier - Email or phone number
   */
  async unlockAccount(identifier: string): Promise<void> {
    await this.clearLockout(identifier);
    this.logger.log(`Account manually unlocked: ${identifier}`);
  }
}
