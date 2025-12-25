import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateProvinceDto, UpdateProvinceDto } from './dtos/create-update-province.dto';
import { CommonErrorMessagesEnum } from 'libs/common';
import { Province } from './models';
import { FilterProvincesDto, SortProvinceDto } from './dtos/query-provinces.dto';
import { getPaginationParams, createPaginatedResponse, PaginationParams } from 'libs/common/utils';
import { BaseService } from '@/common/services/base.service';
import {
  CacheService,
  CACHE_KEYS,
  CACHE_TTL,
  buildListCacheKey,
  buildCacheKey,
} from '@/common/cache';

@Injectable()
export class ProvincesService extends BaseService {
  private readonly logger = new Logger(ProvincesService.name);

  constructor(
    protected readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
  ) {
    super(databaseService);
  }

  /**
   * Invalidates all province-related cache entries.
   */
  private async invalidateProvinceCache(provinceId?: string): Promise<void> {
    const keysToInvalidate = [buildCacheKey(CACHE_KEYS.PROVINCES.LIST, 'all')];

    if (provinceId) {
      keysToInvalidate.push(buildCacheKey(CACHE_KEYS.PROVINCES.DETAIL, provinceId));
    }

    await this.cacheService.invalidate(...keysToInvalidate);
    // Also invalidate pattern-based keys for list queries
    await this.cacheService.delByPattern(CACHE_KEYS.PROVINCES.ALL);
  }

  private async validateUniqueFields(
    name: string,
    slug: string,
    zip_code: string,
    excludeId?: string,
  ): Promise<void> {
    const whereClause: any = {
      OR: [{ name }, { slug }, { zip_code }],
      isDeleted: false,
    };

    // If we're updating (excludeId is provided), exclude the current province
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    const existingProvince = await this.databaseService.province.findFirst({
      where: whereClause,
    });

    if (existingProvince) {
      let conflictField = 'details';
      if (existingProvince.name === name) {
        conflictField = 'name';
      } else if (existingProvince.slug === slug) {
        conflictField = 'slug';
      } else if (existingProvince.zip_code === zip_code) {
        conflictField = 'zip code';
      }

      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          message: `A province with this ${conflictField} already exists`,
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  async create(createProvinceDto: CreateProvinceDto): Promise<Province> {
    try {
      // Validate unique fields before creation
      await this.validateUniqueFields(
        createProvinceDto.name,
        createProvinceDto.slug,
        createProvinceDto.zip_code,
      );

      const province = await this.databaseService.province.create({
        data: {
          name: createProvinceDto.name,
          slug: createProvinceDto.slug,
          zip_code: createProvinceDto.zip_code,
          translations: {
            create: createProvinceDto.translations
              ? createProvinceDto.translations.map((t) => ({
                  language: t.language,
                  name: t.name,
                }))
              : [],
          },
        },
        include: {
          _count: true,
          translations: true,
        },
      });

      // Invalidate cache after creating a new province
      await this.invalidateProvinceCache();

      return new Province(province);
    } catch (error) {
      console.error('Create province error details:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      // Handle language enum validation errors
      if (error.code === 'P2012' || error.code === 'P2006') {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            message: 'Invalid language value. Must be a valid language code',
            details: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Handle Prisma unique constraint violation error
      if (error.code === 'P2002') {
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT,
            message: 'A province with these details already exists',
          },
          HttpStatus.CONFLICT,
        );
      }

      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findMany(
    paginationOptions: PaginationParams,
    filterOptions?: FilterProvincesDto,
    sortOptions?: SortProvinceDto[],
    includeDeleted = false,
  ) {
    try {
      const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);

      // Build cache key based on query parameters
      const cacheKey = buildListCacheKey(CACHE_KEYS.PROVINCES.LIST, {
        page,
        pageSize,
        filters: filterOptions,
        sort: sortOptions,
      });

      // Try to get from cache first
      return await this.cacheService.getOrSet(
        cacheKey,
        async () => {
          const where = this.mergeWithBaseWhere(
            filterOptions?.keyword
              ? {
                  OR: [
                    { name: { contains: filterOptions.keyword, mode: 'insensitive' } },
                    { zip_code: { contains: filterOptions.keyword } },
                  ],
                }
              : {},
            includeDeleted,
          );

          const orderBy = sortOptions?.reduce(
            (acc, { orderBy: field, order }) => ({
              ...acc,
              [field]: order.toLowerCase(),
            }),
            {},
          );

          const [provinces, total] = await this.databaseService.$transaction([
            this.databaseService.province.findMany({
              where,
              skip,
              take,
              orderBy,
              include: {
                _count: true,
                translations: true,
              },
            }),
            this.databaseService.province.count({ where }),
          ]);

          return createPaginatedResponse(
            provinces.map((province) => new Province(province)),
            total,
            page,
            pageSize,
          );
        },
        CACHE_TTL.PROVINCES_LIST,
      );
    } catch (error) {
      this.logger.error('Find provinces error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findById(id: string, includeDeleted = false): Promise<Province> {
    try {
      const cacheKey = buildCacheKey(CACHE_KEYS.PROVINCES.DETAIL, id);

      // Don't cache if including deleted
      if (includeDeleted) {
        return this.fetchProvinceById(id, includeDeleted);
      }

      return await this.cacheService.getOrSet(
        cacheKey,
        () => this.fetchProvinceById(id, includeDeleted),
        CACHE_TTL.PROVINCE_DETAIL,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  private async fetchProvinceById(id: string, includeDeleted: boolean): Promise<Province> {
    const province = await this.databaseService.province.findFirst({
      where: this.mergeWithBaseWhere({ id }, includeDeleted),
      include: {
        _count: true,
        translations: true,
      },
    });

    if (!province) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: 'Province not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return new Province(province);
  }

  async update(id: string, updateProvinceDto: UpdateProvinceDto): Promise<Province> {
    try {
      await this.findById(id);

      await this.validateUniqueFields(
        updateProvinceDto.name,
        updateProvinceDto.slug,
        updateProvinceDto.zip_code,
        id, // Exclude this ID from uniqueness check
      );

      let updatedProvince = await this.databaseService.province.update({
        where: { id },
        data: {
          name: updateProvinceDto.name,
          slug: updateProvinceDto.slug,
          zip_code: updateProvinceDto.zip_code,
        },
        include: {
          _count: true,
          translations: true,
        },
      });

      if (updateProvinceDto.translations?.length > 0) {
        const currentTranslations = updatedProvince.translations || [];

        for (const translation of updateProvinceDto.translations) {
          const existingTranslation = currentTranslations.find(
            (t) => t.language === translation.language,
          );

          if (existingTranslation) {
            await this.databaseService.provinceTranslation.update({
              where: { id: existingTranslation.id },
              data: { name: translation.name },
            });
          } else {
            await this.databaseService.provinceTranslation.create({
              data: {
                provinceId: id,
                language: translation.language,
                name: translation.name,
              },
            });
          }
        }

        updatedProvince = await this.databaseService.province.findUnique({
          where: { id },
          include: {
            _count: true,
            translations: true,
          },
        });
      }

      // Invalidate cache after updating
      await this.invalidateProvinceCache(id);

      return new Province(updatedProvince);
    } catch (error) {
      console.error('Update province error:', error);

      // More specific error handling
      if (error.code === 'P2002') {
        throw new HttpException(
          {
            status: HttpStatus.CONFLICT,
            message: 'Province with this name, slug, or zip code already exists',
          },
          HttpStatus.CONFLICT,
        );
      }

      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.softDelete('province', id, async () => {
        // Additional checks before soft delete
        const province = await this.databaseService.province.findUnique({
          where: { id },
          include: {
            branches: {
              where: { isDeleted: false },
            },
          },
        });

        if (!province) {
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              message: 'Province not found',
            },
            HttpStatus.NOT_FOUND,
          );
        }

        if (province.branches.length > 0) {
          throw new HttpException(
            {
              status: HttpStatus.CONFLICT,
              message: 'Cannot delete province with existing branches',
            },
            HttpStatus.CONFLICT,
          );
        }
      });

      // Invalidate cache after deletion
      await this.invalidateProvinceCache(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async restore(id: string): Promise<Province> {
    try {
      await this.restoreDeleted<Province>('province', id);

      // Invalidate cache after restoration
      await this.invalidateProvinceCache(id);

      // Fetch the complete province with translations after restoration
      return this.findById(id, false);
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findDeleted() {
    try {
      const provinces = await this.databaseService.province.findMany({
        where: { isDeleted: true },
        include: {
          _count: true,
          translations: true, // Include translations
        },
      });

      return provinces.map((province) => new Province(province));
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
