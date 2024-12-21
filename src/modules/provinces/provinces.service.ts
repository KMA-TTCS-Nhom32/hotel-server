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

@Injectable()
export class ProvincesService {
  constructor(private readonly databaseService: DatabaseService) {}

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
  ) {
    try {
      const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);

      const where: any = {
        ...(filterOptions?.keyword
          ? {
              OR: [
                { name: { contains: filterOptions.keyword, mode: 'insensitive' } },
                { zip_code: { contains: filterOptions.keyword } },
              ],
            }
          : {}),
      };

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

  async findById(id: string): Promise<Province> {
    try {
      const province = await this.databaseService.province.findUnique({
        where: { id },
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
      // Start transaction
      await this.databaseService.$transaction(async (prisma) => {
        // 1. Check if province exists and has branches
        const province = await prisma.province.findUnique({
          where: { id },
          include: {
            branches: true,
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

        // 2. Check if province has any branches
        if (province.branches.length > 0) {
          throw new HttpException(
            {
              status: HttpStatus.CONFLICT,
              message: 'Cannot delete province with existing branches',
            },
            HttpStatus.CONFLICT,
          );
        }

        // 3. Delete the province
        await prisma.province.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
