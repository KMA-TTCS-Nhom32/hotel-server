import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '@/third-party/cloudinary/cloudinary.service';
import { DatabaseService } from '@/database/database.service';
import {
  CommonErrorMessagesEnum,
  createPaginatedResponse,
  getPaginationParams,
  PaginationParams,
} from 'libs/common';
import { CreateAmenityDto, FilterAmenityDto, SortAmenityDto, UpdateAmenityDto } from './dtos';

@Injectable()
export class AmenitiesService {
  constructor(
    private readonly databaseSerivce: DatabaseService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async uploadIcon(icon: Express.Multer.File) {
    try {
      return await this.cloudinaryService.uploadImage(icon, true);
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.GetImageFailed);
    }
  }

  async create(dto: CreateAmenityDto, icon?: Express.Multer.File) {
    const iconData = icon ? await this.uploadIcon(icon) : null;

    return this.databaseSerivce.amenity.create({
      data: {
        ...dto,
        icon: iconData,
      },
    });
  }

  async findMany(
    paginationOptions: PaginationParams,
    filterOptions?: FilterAmenityDto,
    sortOptions?: SortAmenityDto[], // Change type to match the DTO
  ) {
    const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);
    const { types, search } = filterOptions || {};

    const where: Prisma.AmenityWhereInput = {
      ...(types && { type: { in: types } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Default sort by createdAt desc if no sort options provided
    const orderBy = sortOptions?.length
      ? sortOptions.reduce(
          (acc, { orderBy: field, order }) => ({
            ...acc,
            [field]: order.toLowerCase(),
          }),
          {}
        )
      : { createdAt: 'desc' };

    const [amenities, total] = await this.databaseSerivce.$transaction([
      this.databaseSerivce.amenity.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.databaseSerivce.amenity.count({ where }),
    ]);

    return createPaginatedResponse(amenities, total, page, pageSize);
  }

  async findOne(id: string) {
    const amenity = await this.databaseSerivce.amenity.findUnique({ where: { id } });
    if (!amenity) throw new NotFoundException('Amenity not found');
    return amenity;
  }

  async update(id: string, dto: UpdateAmenityDto, icon?: Express.Multer.File) {
    await this.findOne(id);

    let iconData = undefined;
    if (icon) {
      iconData = await this.uploadIcon(icon);
    }

    return this.databaseSerivce.amenity.update({
      where: { id },
      data: {
        ...dto,
        ...(iconData && { icon: iconData }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.databaseSerivce.amenity.delete({ where: { id } });
  }
}
