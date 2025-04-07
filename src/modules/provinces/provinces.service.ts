import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateProvinceDto, UpdateProvinceDto } from './dtos/create-update-province.dto';
import { CommonErrorMessagesEnum } from 'libs/common';
import { Province } from './models';
import { FilterProvincesDto, SortProvinceDto } from './dtos/query-provinces.dto';
import { getPaginationParams, createPaginatedResponse, PaginationParams } from 'libs/common/utils';
import { BaseService } from '@/common/services/base.service';
// import { PoeditorService } from '@/third-party/poeditor/poeditor.service';

@Injectable()
export class ProvincesService extends BaseService {
  constructor(
    protected readonly databaseService: DatabaseService,
    // private readonly poeditorService: PoeditorService,
  ) {
    super(databaseService);
  }

  // Helper method to map database province object to Province model with translations
  private mapProvinceWithTranslations(province: Province): Province {
    // Format translations to match the model structure
    const formattedTranslations =
      province.translations?.map((translation) => ({
        language: translation.language,
        name: translation.name,
      })) || [];

    // Create a new Province instance with all properties including translations
    return new Province({
      ...province,
      translations: formattedTranslations,
    });
  }

  // Helper method to validate unique fields
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
      // Determine which field caused the conflict for better error messaging
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

      // Create province with translations in a single transaction
      const province = await this.databaseService.province.create({
        data: {
          name: createProvinceDto.name,
          slug: createProvinceDto.slug,
          zip_code: createProvinceDto.zip_code,
          ...(createProvinceDto.translations?.length > 0 && {
            translations: {
              create:
                createProvinceDto.translations?.map((translation) => ({
                  language: translation.language,
                  name: translation.name,
                })) || [],
            },
          }),
        },
        include: {
          _count: true,
          translations: true,
        },
      });

      // Return the province with properly mapped translations
      return this.mapProvinceWithTranslations(province);
    } catch (error) {
      console.error('Create province error details:', error);

      // If the error is already a HttpException (like our conflict check above), rethrow it
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
            translations: true, // Include translations
          },
        }),
        this.databaseService.province.count({ where }),
      ]);

      return createPaginatedResponse(
        provinces.map((province) => this.mapProvinceWithTranslations(province)),
        total,
        page,
        pageSize,
      );
    } catch (error) {
      console.error('Find provinces error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findById(id: string, includeDeleted = false): Promise<Province> {
    try {
      const province = await this.databaseService.province.findFirst({
        where: this.mergeWithBaseWhere({ id }, includeDeleted),
        include: {
          _count: true,
          translations: true, // Include translations
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

      return this.mapProvinceWithTranslations(province);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
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

      return this.mapProvinceWithTranslations(updatedProvince);
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
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async restore(id: string): Promise<Province> {
    try {
      await this.restoreDeleted<Province>('province', id);

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

      return provinces.map((province) => this.mapProvinceWithTranslations(province));
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
