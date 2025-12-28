import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { CACHE_TTL, CACHE_NAMESPACE } from './cache.constants';

/**
 * Reusable cache service that provides helper methods for common caching operations.
 * Includes automatic cache invalidation patterns and cache warming capabilities.
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis | null = null;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Create a separate Redis client for pattern-based operations
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

      this.redisClient = new Redis({
        host: redisHost,
        port: parseInt(redisPort, 10),
        password: redisPassword || undefined,
      });

      this.redisClient.on('error', (err) => {
        this.logger.error('Redis client error:', err);
      });

      // Clear all cache on server startup to ensure fresh state
      await this.clearAllOnStartup();

      this.logger.log('CacheService initialized with direct Redis client for pattern operations');
    } catch (error) {
      this.logger.warn('Could not initialize Redis client for pattern operations:', error.message);
    }
  }

  /**
   * Clears all cache keys on server startup to ensure fresh state.
   * This prevents stale data issues after deployments.
   */
  private async clearAllOnStartup(): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      // Find all keys related to our namespace
      const patterns = [`${CACHE_NAMESPACE}:*`, `keyv:${CACHE_NAMESPACE}:*`];

      let totalDeleted = 0;
      for (const pattern of patterns) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          const deleted = await this.redisClient.del(...keys);
          totalDeleted += deleted;
          this.logger.debug(`Cleared ${deleted} keys matching pattern: ${pattern}`);
        }
      }

      // Also clear in-memory cache
      await this.clear();

      this.logger.log(`Cache cleared on startup: ${totalDeleted} Redis keys deleted`);
    } catch (error) {
      this.logger.warn('Failed to clear cache on startup:', error.message);
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('CacheService Redis client disconnected');
    }
  }

  /**
   * Gets a value from the cache.
   * @param key - The cache key
   * @returns The cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cache.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT: ${key}`);
      } else {
        this.logger.debug(`Cache MISS: ${key}`);
      }
      return value ?? null;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Sets a value in the cache.
   * @param key - The cache key
   * @param value - The value to cache
   * @param ttl - Time to live in milliseconds (optional, uses default if not provided)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttl ?? CACHE_TTL.DEFAULT);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl ?? CACHE_TTL.DEFAULT}ms)`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Deletes a specific key from the cache.
   * @param key - The cache key to delete
   */
  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for key ${key}:`, error);
    }
  }

  /**
   * Deletes all keys matching a pattern.
   * Uses direct Redis client for pattern-based deletion.
   * @param pattern - The pattern to match (e.g., 'provinces:*')
   */
  async delByPattern(pattern: string): Promise<number> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not available for pattern deletion');
      return 0;
    }

    try {
      // Keyv stores keys with format: namespace:key
      // Try multiple patterns to find the keys
      const patterns = [
        `${CACHE_NAMESPACE}:${pattern}`, // hotel-server:provinces:*
        `keyv:${CACHE_NAMESPACE}:${pattern}`, // keyv:hotel-server:provinces:*
        `*${pattern}`, // *provinces:*
      ];

      let allKeys: string[] = [];
      for (const p of patterns) {
        const keys = await this.redisClient.keys(p);
        if (keys.length > 0) {
          this.logger.debug(`Found ${keys.length} keys with pattern: ${p}`);
          allKeys = [...allKeys, ...keys];
        }
      }

      // Remove duplicates
      allKeys = [...new Set(allKeys)];

      if (allKeys.length === 0) {
        this.logger.debug(`No keys found matching pattern: ${pattern}`);
        return 0;
      }

      // Delete all matching keys from Redis
      const deletedCount = await this.redisClient.del(...allKeys);
      this.logger.log(`Cache DEL by pattern: ${pattern} (${deletedCount} keys deleted)`);

      // Also clear in-memory cache
      for (const key of allKeys) {
        // Try to extract the original key and delete from cache-manager
        const keyVariants = [
          key,
          key.replace(`${CACHE_NAMESPACE}:`, ''),
          key.replace(`keyv:${CACHE_NAMESPACE}:`, ''),
          key.replace('keyv:', ''),
        ];
        for (const variant of keyVariants) {
          try {
            await this.cache.del(variant);
          } catch {
            // Ignore errors for individual deletions
          }
        }
      }

      return deletedCount;
    } catch (error) {
      this.logger.error(`Cache DEL by pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Lists all keys in Redis matching a pattern (for debugging)
   * @param pattern - Pattern to search for
   */
  async listKeys(pattern: string = '*'): Promise<string[]> {
    if (!this.redisClient) {
      return [];
    }
    try {
      return await this.redisClient.keys(pattern);
    } catch (error) {
      this.logger.error('Error listing keys:', error);
      return [];
    }
  }

  /**
   * Clears all keys from the cache stores.
   * Uses the underlying store's clear functionality if available.
   */
  async clear(): Promise<void> {
    try {
      // Access the underlying stores to clear them
      const stores = (this.cache as any).stores;
      if (stores && Array.isArray(stores)) {
        await Promise.all(
          stores.map(async (store: any) => {
            if (store?.clear && typeof store.clear === 'function') {
              await store.clear();
            }
          }),
        );
      }
      this.logger.log('Cache CLEAR: All keys cleared');
    } catch (error) {
      this.logger.error('Cache CLEAR error:', error);
    }
  }

  /**
   * Gets a cached value or fetches it using the provided function.
   * This is the primary method for implementing cache-aside pattern.
   * @param key - The cache key
   * @param fetchFn - Function to fetch the data if not cached
   * @param ttl - Time to live in milliseconds
   * @returns The cached or fetched value
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidates cache entries by deleting multiple keys.
   * @param keys - Array of cache keys to invalidate
   */
  async invalidate(...keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.del(key)));
    this.logger.debug(`Cache INVALIDATED: ${keys.join(', ')}`);
  }

  /**
   * Warms the cache by pre-fetching data.
   * @param key - The cache key
   * @param fetchFn - Function to fetch the data
   * @param ttl - Time to live in milliseconds
   */
  async warm<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<void> {
    try {
      const value = await fetchFn();
      await this.set(key, value, ttl);
      this.logger.log(`Cache WARMED: ${key}`);
    } catch (error) {
      this.logger.error(`Cache WARM error for key ${key}:`, error);
    }
  }
}
