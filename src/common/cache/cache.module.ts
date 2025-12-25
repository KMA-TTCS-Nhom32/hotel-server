import { Module, Global, Logger, OnModuleInit } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { CacheableMemory } from 'cacheable';
import { CacheService } from './cache.service';
import { CacheWarmupService } from './cache-warmup.service';
import { CACHE_TTL, CACHE_NAMESPACE } from './cache.constants';
import { DatabaseModule } from '@/database/database.module';

/**
 * Global cache module that provides Redis caching with an optional in-memory L1 cache.
 * Uses Keyv adapters for cache-manager v6 compatibility.
 */
@Global()
@Module({
  imports: [
    DatabaseModule,
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('CacheModule');
        const isProduction = configService.get('NODE_ENV') === 'production';

        // Build Redis connection URL
        const redisHost = isProduction
          ? configService.get('REDIS_PROD_HOST')
          : configService.get('REDIS_HOST');
        const redisPort = isProduction
          ? configService.get('REDIS_PROD_PORT')
          : configService.get('REDIS_PORT');
        const redisPassword = isProduction
          ? configService.get('REDIS_PROD_PASSWORD')
          : configService.get('REDIS_PASSWORD');

        const redisUrl = redisPassword
          ? `redis://:${redisPassword}@${redisHost}:${redisPort}`
          : `redis://${redisHost}:${redisPort}`;

        logger.log(`Connecting to Redis at ${redisHost}:${redisPort}...`);

        try {
          // Create Redis store using Keyv adapter
          const redisStore = new KeyvRedis(redisUrl, {
            useUnlink: true,
            namespace: CACHE_NAMESPACE,
          });

          // Create in-memory L1 cache for faster access (optional)
          const memoryStore = new Keyv({
            store: new CacheableMemory({
              ttl: CACHE_TTL.DEFAULT,
              lruSize: 1000, // Max items in memory
            }),
          });

          logger.log('Redis cache connection established successfully');

          return {
            // Multi-tier caching: Memory (L1) -> Redis (L2)
            stores: [memoryStore, redisStore],
            ttl: CACHE_TTL.DEFAULT,
          };
        } catch (error) {
          logger.error('Failed to connect to Redis, falling back to memory-only cache:', error);

          // Fallback to memory-only cache if Redis is unavailable
          return {
            stores: [
              new Keyv({
                store: new CacheableMemory({
                  ttl: CACHE_TTL.DEFAULT,
                  lruSize: 5000,
                }),
              }),
            ],
            ttl: CACHE_TTL.DEFAULT,
          };
        }
      },
      inject: [ConfigService],
      isGlobal: true,
    }),
  ],
  providers: [CacheService, CacheWarmupService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule implements OnModuleInit {
  private readonly logger = new Logger(CacheModule.name);

  onModuleInit() {
    this.logger.log('CacheModule initialized with multi-tier caching (Memory + Redis)');
  }
}
