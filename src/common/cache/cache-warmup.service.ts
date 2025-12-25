import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CacheService } from './cache.service';
import { CACHE_KEYS, CACHE_TTL } from './cache.constants';
import { buildCacheKey } from './cache.utils';
import { Province } from '@/modules/provinces/models';
import { Branch } from '@/modules/branch/models';

/**
 * Service responsible for warming the cache on application startup.
 * Pre-populates frequently accessed data like provinces and latest branches.
 */
@Injectable()
export class CacheWarmupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CacheWarmupService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly databaseService: DatabaseService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Starting cache warmup...');

    try {
      await Promise.all([this.warmProvinces(), this.warmLatestBranches()]);

      this.logger.log('Cache warmup completed successfully');
    } catch (error) {
      this.logger.error('Cache warmup failed:', error);
    }
  }

  /**
   * Warms the provinces cache.
   * Provinces rarely change, so we cache the full list.
   */
  private async warmProvinces(): Promise<void> {
    const cacheKey = buildCacheKey(CACHE_KEYS.PROVINCES.LIST, 'all');

    await this.cacheService.warm(
      cacheKey,
      async () => {
        const provinces = await this.databaseService.province.findMany({
          where: { isDeleted: false },
          include: {
            _count: true,
            translations: true,
          },
          orderBy: { name: 'asc' },
        });

        return provinces.map((province) => new Province(province));
      },
      CACHE_TTL.PROVINCES_LIST,
    );

    this.logger.log(`Warmed provinces cache: ${cacheKey}`);
  }

  /**
   * Warms the latest branches cache for common limits.
   */
  private async warmLatestBranches(): Promise<void> {
    // Warm for common limit values
    const limits = [3, 5, 10];

    for (const limit of limits) {
      const cacheKey = buildCacheKey(CACHE_KEYS.BRANCHES.LATEST, String(limit));

      await this.cacheService.warm(
        cacheKey,
        async () => {
          const branches = await this.databaseService.hotelBranch.findMany({
            where: { is_active: true, isDeleted: false },
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              province: {
                include: {
                  translations: true,
                },
              },
              translations: true,
            },
          });

          return branches.map((branch) => new Branch(branch));
        },
        CACHE_TTL.BRANCHES_LATEST,
      );

      this.logger.log(`Warmed latest branches cache: ${cacheKey}`);
    }
  }
}
