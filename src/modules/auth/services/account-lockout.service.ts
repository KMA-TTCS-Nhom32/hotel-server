import { Injectable, Logger, Inject, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import Redis from 'ioredis';

/**
 * Configuration for account lockout
 */
export const LOCKOUT_CONFIG = {
  /** Maximum failed attempts before lockout */
  MAX_FAILED_ATTEMPTS: 3,
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
 * Implements atomic operations to prevent race conditions.
 */
@Injectable()
export class AccountLockoutService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AccountLockoutService.name);
  private redisClient: Redis | null = null;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initialize direct Redis connection for atomic operations
   */
  async onModuleInit(): Promise<void> {
    try {
      const isProduction = this.configService.get('NODE_ENV') === 'production';
      const redisHost = isProduction
        ? this.configService.get('REDIS_PROD_HOST')
        : this.configService.get('REDIS_HOST');
      const redisPort = isProduction
        ? this.configService.get('REDIS_PROD_PORT')
        : this.configService.get('REDIS_PORT');
      const redisPassword = isProduction
        ? this.configService.get('REDIS_PROD_PASSWORD')
        : this.configService.get('REDIS_PASSWORD');

      if (redisHost && redisPort) {
        this.redisClient = new Redis({
          host: redisHost,
          port: parseInt(redisPort, 10),
          password: redisPassword || undefined,
          lazyConnect: true,
          retryStrategy: (times) => Math.min(times * 50, 2000),
        });

        await this.redisClient.connect();
        this.logger.log('Redis client connected for atomic lockout operations');
      } else {
        this.logger.warn(
          'Redis not configured, using non-atomic fallback (not recommended for production)',
        );
      }
    } catch (error) {
      this.logger.error('Failed to connect Redis client for lockout service:', error);
      this.redisClient = null;
    }
  }

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

      if (this.redisClient) {
        const lockoutTime = await this.redisClient.get(lockoutKey);
        return lockoutTime !== null;
      } else {
        const lockoutTime = await this.cache.get<number>(lockoutKey);
        return lockoutTime !== null && lockoutTime !== undefined;
      }
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

      let lockoutTime: number | null = null;
      let failedAttempts: number | null = null;

      if (this.redisClient) {
        // Use Redis directly for consistency with atomic operations
        const [lockoutValue, attemptsValue] = await Promise.all([
          this.redisClient.get(lockoutKey),
          this.redisClient.get(failedAttemptsKey),
        ]);
        lockoutTime = lockoutValue ? parseInt(lockoutValue, 10) : null;
        failedAttempts = attemptsValue ? parseInt(attemptsValue, 10) : null;
      } else {
        // Fallback to cache manager
        [lockoutTime, failedAttempts] = await Promise.all([
          this.cache.get<number>(lockoutKey),
          this.cache.get<number>(failedAttemptsKey),
        ]);
      }

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
   * Records a failed login attempt and locks the account if threshold is reached.
   * Uses Redis INCR for atomic increment to prevent race conditions.
   * @param identifier - Email or phone number
   * @returns Updated lockout status
   */
  async recordFailedAttempt(identifier: string): Promise<LockoutStatus> {
    try {
      const failedAttemptsKey = this.getFailedAttemptsKey(identifier);
      let newAttempts: number;

      if (this.redisClient) {
        // Use atomic INCR operation to prevent race conditions
        newAttempts = await this.atomicIncrement(failedAttemptsKey);
      } else {
        // Fallback for non-Redis environments (development/testing)
        // WARNING: This has race condition vulnerability
        this.logger.warn('Using non-atomic increment - race condition possible');
        const currentAttempts = (await this.cache.get<number>(failedAttemptsKey)) ?? 0;
        newAttempts = currentAttempts + 1;
        await this.cache.set(failedAttemptsKey, newAttempts, LOCKOUT_CONFIG.ATTEMPT_WINDOW_MS);
      }

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
   * Atomically increments the failed attempts counter using Redis INCR.
   * Sets TTL on first increment.
   * @param key - Redis key for failed attempts
   * @returns New counter value after increment
   */
  private async atomicIncrement(key: string): Promise<number> {
    const ttlSeconds = Math.ceil(LOCKOUT_CONFIG.ATTEMPT_WINDOW_MS / 1000);

    // Use Redis transaction for atomic increment with TTL
    const results = await this.redisClient.multi().incr(key).expire(key, ttlSeconds).exec();

    // Extract the INCR result (first command result)
    const incrResult = results?.[0];
    if (incrResult && incrResult[0] === null) {
      return incrResult[1] as number;
    }

    throw new Error('Failed to execute atomic increment');
  }

  /**
   * Locks an account for the configured duration
   * @param identifier - Email or phone number
   */
  private async lockAccount(identifier: string): Promise<void> {
    const lockoutKey = this.getLockoutKey(identifier);
    const lockoutEndsAt = Date.now() + LOCKOUT_CONFIG.LOCKOUT_DURATION_MS;
    const ttlSeconds = Math.ceil(LOCKOUT_CONFIG.LOCKOUT_DURATION_MS / 1000);

    if (this.redisClient) {
      // Use Redis directly with TTL
      await this.redisClient.setex(lockoutKey, ttlSeconds, lockoutEndsAt.toString());
    } else {
      await this.cache.set(lockoutKey, lockoutEndsAt, LOCKOUT_CONFIG.LOCKOUT_DURATION_MS);
    }
  }

  /**
   * Clears failed attempts and lockout for an account (called on successful login)
   * @param identifier - Email or phone number
   */
  async clearLockout(identifier: string): Promise<void> {
    try {
      const failedAttemptsKey = this.getFailedAttemptsKey(identifier);
      const lockoutKey = this.getLockoutKey(identifier);

      if (this.redisClient) {
        // Use Redis DEL for atomic deletion
        await this.redisClient.del(failedAttemptsKey, lockoutKey);
      } else {
        // Fallback to cache manager
        await Promise.all([this.cache.del(failedAttemptsKey), this.cache.del(lockoutKey)]);
      }

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

  // ============================================================
  // TEST METHODS - FOR PRESENTATION/DEMO ONLY
  // Remove or protect these in production!
  // ============================================================

  /**
   * [TEST] Gets all lockout-related keys and their values
   * @returns All failed attempts and lockout data
   */
  async getAllLockoutData(): Promise<{
    failedAttempts: Array<{ identifier: string; attempts: number; ttl: number }>;
    lockedAccounts: Array<{ identifier: string; lockoutEndsAt: Date; ttl: number }>;
  }> {
    if (!this.redisClient) {
      return { failedAttempts: [], lockedAccounts: [] };
    }

    try {
      // Find all failed attempts keys
      const failedAttemptsKeys = await this.redisClient.keys(
        `${LOCKOUT_CONFIG.FAILED_ATTEMPTS_PREFIX}*`,
      );
      const lockoutKeys = await this.redisClient.keys(`${LOCKOUT_CONFIG.LOCKOUT_PREFIX}*`);

      // Get failed attempts data
      const failedAttempts = await Promise.all(
        failedAttemptsKeys.map(async (key) => {
          const [value, ttl] = await Promise.all([
            this.redisClient.get(key),
            this.redisClient.ttl(key),
          ]);
          return {
            identifier: key.replace(LOCKOUT_CONFIG.FAILED_ATTEMPTS_PREFIX, ''),
            attempts: parseInt(value || '0', 10),
            ttl,
          };
        }),
      );

      // Get locked accounts data
      const lockedAccounts = await Promise.all(
        lockoutKeys.map(async (key) => {
          const [value, ttl] = await Promise.all([
            this.redisClient.get(key),
            this.redisClient.ttl(key),
          ]);
          return {
            identifier: key.replace(LOCKOUT_CONFIG.LOCKOUT_PREFIX, ''),
            lockoutEndsAt: new Date(parseInt(value || '0', 10)),
            ttl,
          };
        }),
      );

      return { failedAttempts, lockedAccounts };
    } catch (error) {
      this.logger.error('Error getting all lockout data:', error);
      return { failedAttempts: [], lockedAccounts: [] };
    }
  }

  /**
   * [TEST] Clears all lockout data (failed attempts and lockouts)
   * @returns Number of keys deleted
   */
  async clearAllLockouts(): Promise<{ deletedCount: number; message: string }> {
    if (!this.redisClient) {
      return { deletedCount: 0, message: 'Redis not connected' };
    }

    try {
      // Find all lockout-related keys
      const failedAttemptsKeys = await this.redisClient.keys(
        `${LOCKOUT_CONFIG.FAILED_ATTEMPTS_PREFIX}*`,
      );
      const lockoutKeys = await this.redisClient.keys(`${LOCKOUT_CONFIG.LOCKOUT_PREFIX}*`);

      const allKeys = [...failedAttemptsKeys, ...lockoutKeys];

      if (allKeys.length === 0) {
        return { deletedCount: 0, message: 'No lockout data to clear' };
      }

      // Delete all keys
      const deletedCount = await this.redisClient.del(...allKeys);

      this.logger.log(`[TEST] Cleared ${deletedCount} lockout keys`);

      return {
        deletedCount,
        message: `Cleared ${deletedCount} lockout keys (${failedAttemptsKeys.length} failed attempts, ${lockoutKeys.length} lockouts)`,
      };
    } catch (error) {
      this.logger.error('Error clearing all lockouts:', error);
      return { deletedCount: 0, message: `Error: ${error.message}` };
    }
  }

  /**
   * Cleanup Redis connection on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis client disconnected');
    }
  }
}
