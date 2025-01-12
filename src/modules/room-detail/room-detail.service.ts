import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateRoomDetailDto, UpdateRoomDetailDto } from './dtos/create-update-room-detail.dto';
import { CommonErrorMessagesEnum } from 'libs/common';
import { RoomDetail } from './models';
import { FilterRoomDetailDto, SortRoomDetailDto } from './dtos/query-room-detail.dto';
import {
  getPaginationParams,
  createPaginatedResponse,
  PaginationParams,
  createInfinityPaginationResponse,
} from 'libs/common/utils';
import { Image } from '../images/models';
import { BaseService } from '@/common/services';
import Decimal from 'decimal.js';

@Injectable()
export class RoomDetailService extends BaseService {
  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService);
  }

  private formatImage(image: Image): Record<string, any> {
    return {
      url: image.url,
      publicId: image.publicId,
    };
  }

  private async checkSlugExisted(slug: string, branchId: string) {
    const existedSlug = await this.databaseService.roomDetail.findFirst({
      where: {
        slug,
        branch: {
          id: branchId,
        },
      },
    });

    if (existedSlug) {
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          message: 'Room detail with this slug already exists',
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  async create(createRoomDetailDto: CreateRoomDetailDto): Promise<RoomDetail> {
    try {
      const { amenityIds, thumbnail, images, ...data } = createRoomDetailDto;
      const formattedThumbnail = this.formatImage(thumbnail);
      const formattedImages = images.map(this.formatImage);

      await this.checkSlugExisted(data.slug, data.branchId);

      const roomDetail = await this.databaseService.roomDetail.create({
        data: {
          ...data,
          amenities: {
            connect: amenityIds.map((id) => ({ id })),
          },
          thumbnail: formattedThumbnail,
          images: formattedImages,
        },
        include: {
          amenities: true,
        },
      });

      return new RoomDetail({
        ...roomDetail,
        amenities: roomDetail.amenities as any[],
        thumbnail: formattedThumbnail as any,
        images: formattedImages as any[],
      });
    } catch (error) {
      console.error('Create room detail error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  private prepareFilterOptions(filterOptions: FilterRoomDetailDto) {
    const {
      keyword,
      room_type,
      bed_type,
      amenities,
      branchId,
      branchSlug,
      provinceId,
      provinceSlug,
      rating_from,
      rating_to,
      maxPrice,
      minPrice,
    } = filterOptions;
    const where: any = {
      flat_rooms: {
        some: {
          isDeleted: false,
          status: 'AVAILABLE',
        },
      },
      ...(keyword && {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
      ...(room_type && { room_type: room_type }),
      ...(bed_type && { bed_type: bed_type }),
      ...(filterOptions?.amenities?.length && {
        amenities: {
          some: {
            slug: {
              in: amenities,
            },
          },
        },
      }),
      ...(branchId && { branchId }),
      ...(branchSlug && { branch: { slug: branchSlug } }),
      ...(provinceId && { branch: { provinceId } }),
      ...(provinceSlug && { branch: { province: { slug: provinceSlug } } }),
      ...(rating_from && rating_to && { rating: { gte: rating_from, lte: rating_to } }),
      ...(minPrice && {
        OR: [
          { base_price_per_hour: { gte: minPrice } },
          { base_price_per_night: { gte: minPrice } },
          { base_price_per_day: { gte: minPrice } },
        ],
      }),
      ...(maxPrice && {
        OR: [
          { base_price_per_hour: { lte: maxPrice } },
          { base_price_per_night: { lte: maxPrice } },
          { base_price_per_day: { lte: maxPrice } },
        ],
      }),
    };

    return this.mergeWithBaseWhere(where);
  }

  private prepareSortOptions(sortOptions: SortRoomDetailDto[]) {
    return sortOptions.reduce(
      (acc, { orderBy: field, order }) => ({
        ...acc,
        [field]: order.toLowerCase(),
      }),
      {},
    );
  }

  async findMany(
    paginationOptions: PaginationParams,
    filterOptions?: FilterRoomDetailDto,
    sortOptions?: SortRoomDetailDto[],
  ) {
    try {
      const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);

      const where = this.prepareFilterOptions(filterOptions);

      const orderBy = this.prepareSortOptions(sortOptions);

      const [roomDetails, total] = await this.databaseService.$transaction([
        this.databaseService.roomDetail.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            amenities: true,
            branch: true,
            flat_rooms: {
              where: {
                isDeleted: false,
                status: 'AVAILABLE',
              },
            },
          },
        }),
        this.databaseService.roomDetail.count({ where }),
      ]);

      return createPaginatedResponse(
        roomDetails.map((roomDetail) => new RoomDetail(roomDetail as any)),
        total,
        page,
        pageSize,
      );
    } catch (error) {
      console.error('Find room details error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findById(id: string): Promise<RoomDetail> {
    try {
      const roomDetail = await this.databaseService.roomDetail.findUnique({
        where: { id },
        include: {
          branch: true,
          amenities: true,
          flat_rooms: {
            where: {
              isDeleted: false,
            },
          },
        },
      });

      if (!roomDetail) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            message: 'Room detail not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return new RoomDetail(roomDetail as any);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  private prepareUpdateData(updateRoomDetailDto: UpdateRoomDetailDto) {
    const updateData = {
      ...updateRoomDetailDto,
      ...(updateRoomDetailDto.thumbnail && {
        thumbnail: this.formatImage(updateRoomDetailDto.thumbnail),
      }),
      ...(updateRoomDetailDto.images && {
        images: updateRoomDetailDto.images.map(this.formatImage),
      }),
      ...(updateRoomDetailDto.amenityIds && {
        amenities: { set: updateRoomDetailDto.amenityIds.map((id) => ({ id })) },
      }),
      ...(updateRoomDetailDto.branchId && {
        branch: { connect: { id: updateRoomDetailDto.branchId } },
      }),
    };

    if (new Decimal(updateData.special_price_per_hour).equals(0))
      updateData.special_price_per_hour = null;

    if (new Decimal(updateData.special_price_per_night).equals(0))
      updateData.special_price_per_night = null;

    if (new Decimal(updateData.special_price_per_day).equals(0))
      updateData.special_price_per_day = null;

    delete updateData.amenityIds;
    delete updateData.branchId;

    return updateData as any;
  }

  async update(id: string, updateRoomDetailDto: UpdateRoomDetailDto) {
    try {
      console.log('updateRoomDetailDto', updateRoomDetailDto);
      return await this.databaseService.$transaction(async (prisma) => {
        await this.findById(id);

        if (updateRoomDetailDto.slug) {
          await this.checkSlugExisted(updateRoomDetailDto.slug, updateRoomDetailDto.branchId);
        }

        const updatedRoomDetail = await prisma.roomDetail.update({
          where: { id },
          data: this.prepareUpdateData(updateRoomDetailDto),
          include: {
            branch: true,
            amenities: true,
            flat_rooms: true,
          },
        });

        return new RoomDetail(updatedRoomDetail as any);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findManyInfinite(
    page: number = 1,
    limit: number = 10,
    filterOptions?: FilterRoomDetailDto,
    sortOptions?: SortRoomDetailDto[],
  ) {
    try {
      const skip = (page - 1) * limit;

      const where = this.prepareFilterOptions(filterOptions);

      const orderBy = this.prepareSortOptions(sortOptions);

      const roomDetails = await this.databaseService.roomDetail.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          amenities: true,
          branch: true,
          flat_rooms: {
            where: {
              isDeleted: false,
              status: 'AVAILABLE',
            },
          },
        },
      });

      return createInfinityPaginationResponse<RoomDetail>(roomDetails as any[], { page, limit });
    } catch (error) {
      console.error('Find room details error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.softDelete('roomDetail', id, async () => {
        const roomDetail = await this.databaseService.roomDetail.findUnique({
          where: { id },
          include: {
            flat_rooms: {
              include: {
                bookings: {
                  where: {
                    status: {
                      in: ['PENDING', 'WAITING_FOR_CHECK_IN', 'CHECKED_IN'],
                    },
                  },
                },
              },
            },
          },
        });

        if (!roomDetail) {
          throw new HttpException(
            { status: HttpStatus.NOT_FOUND, message: 'Room detail not found' },
            HttpStatus.NOT_FOUND,
          );
        }

        const hasActiveBookings = roomDetail.flat_rooms.some((room) => room.bookings.length > 0);
        if (hasActiveBookings) {
          throw new HttpException(
            {
              status: HttpStatus.CONFLICT,
              message: 'Cannot delete room detail with active bookings',
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

  async restore(id: string): Promise<RoomDetail> {
    try {
      const restoredRoomDetail = await this.restoreDeleted<RoomDetail>('roomDetail', id);
      return new RoomDetail(restoredRoomDetail as any);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findDeleted() {
    try {
      const roomDetails = await this.databaseService.roomDetail.findMany({
        where: { isDeleted: true },
        include: {
          amenities: true,
          branch: true,
          flat_rooms: true,
        },
      });

      return roomDetails.map((roomDetail) => new RoomDetail(roomDetail as any));
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
