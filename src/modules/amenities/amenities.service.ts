import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '@/third-party/cloudinary/cloudinary.service';
import { DatabaseService } from '@/database/database.service';
import {
  CommonErrorMessagesEnum,
  createPaginatedResponse,
  getPaginationParams,
  ImageErrorMessagesEnum,
  PaginationParams,
} from 'libs/common';
import { CreateAmenityDto, FilterAmenityDto, SortAmenityDto, UpdateAmenityDto } from './dtos';
import { Amenity } from './models';
import { Image } from '@/modules/images/models';

@Injectable()
export class AmenitiesService {
  constructor(
    private readonly databaseSerivce: DatabaseService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private mapIconToImage(iconData: any): Image | null {
    if (!iconData) return null;
    return {
      url: iconData.secure_url || iconData.url,
      publicId: iconData.public_id,
    };
  }

  private async uploadIcon(icon: Express.Multer.File) {
    try {
      const uploadResult = await this.cloudinaryService.uploadImage(icon, true);
      return this.mapIconToImage(uploadResult);
    } catch (error) {
      throw new InternalServerErrorException(ImageErrorMessagesEnum.ImageUploadFailed);
    }
  }

  async create(dto: CreateAmenityDto, icon?: Express.Multer.File) {
    const iconData = icon ? await this.uploadIcon(icon) : null;

    try {
      const amenity = await this.databaseSerivce.$transaction(async (prisma) => {
        const created = await prisma.amenity.create({
          data: {
            ...dto,
            icon: iconData ? { ...iconData } : null,
          },
        });

        return new Amenity({
          ...created,
          icon: iconData,
        });
      });

      return amenity;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors (e.g., unique constraint violations)
        if (error.code === 'P2002') {
          throw new ConflictException('Amenity with this slug already exists');
        }
      }
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findMany(
    paginationOptions: PaginationParams,
    filterOptions?: FilterAmenityDto,
    sortOptions?: SortAmenityDto[],
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
          {},
        )
      : { createdAt: 'desc' };

    try {
      const [amenityObjects, total] = await this.databaseSerivce.$transaction([
        this.databaseSerivce.amenity.findMany({
          where,
          skip,
          take,
          orderBy,
        }),
        this.databaseSerivce.amenity.count({ where }),
      ]);

      const amenities = amenityObjects.map(
        (amenity) =>
          new Amenity({
            ...amenity,
            icon: this.mapIconToImage(amenity.icon),
          }),
      );

      return createPaginatedResponse(amenities, total, page, pageSize);
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findOne(id: string) {
    const amenity = await this.databaseSerivce.amenity.findUnique({ where: { id } });
    if (!amenity) throw new NotFoundException(CommonErrorMessagesEnum.NotFound);

    return new Amenity({
      ...amenity,
      icon: this.mapIconToImage(amenity.icon),
    });
  }

  async update(id: string, dto: UpdateAmenityDto, icon?: Express.Multer.File) {
    try {
      return await this.databaseSerivce.$transaction(async (prisma) => {
        const existing = await this.findOne(id);
        const iconData = icon ? await this.uploadIcon(icon) : null;

        // If there's an existing icon and we're uploading a new one, delete the old one
        if (existing.icon?.publicId && iconData) {
          await this.cloudinaryService.deleteImage(existing.icon.publicId);
        }

        const updated = await prisma.amenity.update({
          where: { id },
          data: {
            ...dto,
            ...(iconData && { icon: { ...iconData } }),
          },
        });

        return new Amenity({
          ...updated,
          icon: iconData || existing.icon,
        });
      });
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async remove(id: string) {
    try {
      return await this.databaseSerivce.$transaction(async (prisma) => {
        const existing = await this.findOne(id);

        // Delete icon from Cloudinary if it exists
        if (existing.icon?.publicId) {
          await this.cloudinaryService.deleteImage(existing.icon.publicId);
        }

        const deleted = await prisma.amenity.delete({ where: { id } });
        return new Amenity({
          ...deleted,
          icon: this.mapIconToImage(deleted.icon),
        });
      });
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
