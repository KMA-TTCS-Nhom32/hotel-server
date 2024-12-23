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

@Injectable()
export class ProvincesService extends BaseService {
  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService);
  }

  async create(createProvinceDto: CreateProvinceDto): Promise<Province> {
    try {
      const province = await this.databaseService.province.create({
        data: createProvinceDto,
        include: {
          _count: true,
        },
      });

      return new Province(province);
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
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async update(id: string, updateProvinceDto: UpdateProvinceDto): Promise<Province> {
    try {
      await this.findById(id);

      const updatedProvince = await this.databaseService.province.update({
        where: { id },
        include: {
          _count: true,
        },
        data: updateProvinceDto,
      });

      return new Province(updatedProvince);
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
      return await this.restoreDeleted<Province>('province', id);
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
        },
      });

      return provinces.map((province) => new Province(province));
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
