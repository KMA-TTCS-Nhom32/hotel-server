import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { CACHE_TTL } from './cache.constants';

/**
 * Reusable cache service that provides helper methods for common caching operations.
 * Includes automatic cache invalidation patterns and cache warming capabilities.
 */
@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async onModuleInit() {
    this.logger.log('CacheService initialized');
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
   * Note: This uses the underlying store's functionality if available.
   * @param pattern - The pattern to match (e.g., 'provinces:*')
   */
  async delByPattern(pattern: string): Promise<void> {
    try {
      // Access the underlying Keyv store to use pattern-based deletion
      const store = (this.cache as any).stores?.[0];

      if (store?.clear) {
        // If the store supports namespace/pattern clearing
        // For Keyv Redis, we need to use the Redis client directly
        const client = store?.opts?.store?.client || store?.client;

        if (client && typeof client.keys === 'function') {
          const keys = await client.keys(`*${pattern.replace('*', '')}*`);
          if (keys.length > 0) {
            await Promise.all(keys.map((key: string) => client.del(key)));
            this.logger.debug(`Cache DEL by pattern: ${pattern} (${keys.length} keys)`);
          }
        } else {
          this.logger.warn(`Pattern deletion not supported, clearing entire cache namespace`);
        }
      }
    } catch (error) {
      this.logger.error(`Cache DEL by pattern error for ${pattern}:`, error);
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
