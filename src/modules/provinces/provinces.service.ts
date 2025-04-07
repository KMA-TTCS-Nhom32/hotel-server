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

  async create(createProvinceDto: CreateProvinceDto): Promise<Province> {
    try {
      // Add translation to POEditor if needed
      // await this.poeditorService.addTranslation({ ... });

      // Create province with translations in a single transaction
      const province = await this.databaseService.province.create({
        data: {
          name: createProvinceDto.name,
          slug: createProvinceDto.slug,
          zip_code: createProvinceDto.zip_code,
          translations: {
            create:
              createProvinceDto.translations?.map((translation) => ({
                language: translation.language,
                name: translation.name,
              })) || [],
          },
        },
        include: {
          _count: true,
          translations: true,
        },
      });

      // Return the province with properly mapped translations
      return this.mapProvinceWithTranslations(province);
    } catch (error) {
      console.error('Create province error:', error);
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

      const updateData: any = {
        name: updateProvinceDto.name,
        slug: updateProvinceDto.slug,
        zip_code: updateProvinceDto.zip_code,
      };

      // Handle translations if provided
      if (updateProvinceDto.translations?.length > 0) {
        updateData.translations = {
          upsert: updateProvinceDto.translations.map((translation) => ({
            where: {
              provinceId_language: {
                provinceId: id,
                language: translation.language,
              },
            },
            create: {
              provinceId: id,
              language: translation.language,
              name: translation.name,
            },
            update: {
              name: translation.name,
            },
          })),
        };
      }

      const updatedProvince = await this.databaseService.province.update({
        where: { id },
        include: {
          _count: true,
          translations: true,
        },
        data: updateData,
      });

      return this.mapProvinceWithTranslations(updatedProvince);
    } catch (error) {
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
