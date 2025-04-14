import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateRoomDetailDto, UpdateRoomDetailDto } from './dtos/create-update-room-detail.dto';
import { CommonErrorMessagesEnum } from 'libs/common';
import { RoomDetail, RoomDetailWithList } from './models';
import { FilterRoomDetailDto, SortRoomDetailDto } from './dtos/query-room-detail.dto';
import {
  getPaginationParams,
  createPaginatedResponse,
  PaginationParams,
  createInfinityPaginationResponse,
} from 'libs/common/utils';
import { Image } from '../images/models';
import { BaseService } from '@/common/services';
import { parseDate } from 'libs/common/utils/date.util';

@Injectable()
export class RoomDetailService extends BaseService {
  private readonly logger = new Logger(RoomDetailService.name);

  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService);
  }

  private formatImage(image: Image): Record<string, any> {
    return {
      url: image.url,
      publicId: image.publicId,
    };
  }

  //   private async checkAvailableForBooking(detailId: string) {
  //     let isAvailable = false;

  //     const availableRoom = await this.databaseService.hotelRoom.findFirst({
  //       where: {
  //         detailId,
  //         status: 'AVAILABLE',
  //       },
  //     });

  //     if (availableRoom) {
  //       isAvailable = true;
  //     }

  //     return isAvailable;
  //   }

  private async checkSlugExisted(slug: string, branchId: string, id?: string) {
    const existedSlug = await this.databaseService.roomDetail.findFirst({
      where: {
        ...(id && { id: { not: id } }),
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
      const { amenityIds, thumbnail, images, translations, ...data } = createRoomDetailDto;
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
          translations: {
            create: translations
              ? translations.map((t) => ({
                  language: t.language,
                  name: t.name,
                  description: t.description,
                }))
              : [],
          },
        },
        include: {
          amenities: true,
          translations: true,
        },
      });

      return new RoomDetail({
        ...roomDetail,
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
      startDate,
      endDate,
      startTime,
      endTime,
      adults,
      children,
      bookingType,
    } = filterOptions;

    let where: any = {
      flat_rooms: {
        some: {
          isDeleted: false,
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
      ...(adults && { max_adults: { gte: adults } }),
      ...(children && { max_children: { gte: children } }),
      ...(branchId && { branchId }),
      ...(branchSlug && { branch: { slug: branchSlug } }),
      ...(provinceId && { branch: { provinceId } }),
      ...(provinceSlug && { branch: { province: { slug: provinceSlug } } }),
      ...(rating_from && rating_to && { rating: { gte: rating_from, lte: rating_to } }),
      ...(minPrice &&
        maxPrice &&
        bookingType && {
          // OR: [
          //   { base_price_per_hour: { gte: minPrice } },
          //   { base_price_per_night: { gte: minPrice } },
          //   { base_price_per_day: { gte: minPrice } },
          // ],
          ...(bookingType === 'HOURLY' && {
            base_price_per_hour: { gte: minPrice, lte: maxPrice },
          }),
          ...(bookingType === 'NIGHTLY' && {
            // AND: [
            //   { base_price_per_night: { gte: minPrice } },
            //   { base_price_per_night: { lte: maxPrice } },
            // ],
            base_price_per_night: { gte: minPrice, lte: maxPrice },
          }),
          ...(bookingType === 'DAILY' && {
            // AND: [
            //   { base_price_per_day: { gte: minPrice } },
            //   { base_price_per_day: { lte: maxPrice } },
            // ],
            base_price_per_day: { gte: minPrice, lte: maxPrice },
          }),
        }),
    };

    if (startDate && endDate && startTime && endTime) {
      where = {
        ...where,
        flat_rooms: {
          some: {
            isDeleted: false,
            status: {
              not: 'MAINTENANCE',
            },
            // At least one room should not have overlapping bookings
            AND: [
              {
                bookings: {
                  none: {
                    AND: [
                      {
                        status: {
                          in: ['PENDING', 'WAITING_FOR_CHECK_IN', 'CHECKED_IN'],
                        },
                      },
                      {
                        OR: [
                          // Check date range overlap
                          {
                            AND: [
                              { start_date: { lte: parseDate(endDate) } },
                              { end_date: { gte: parseDate(startDate) } },
                            ],
                          },
                          // Check same-day time overlap
                          {
                            AND: [
                              { start_date: { equals: parseDate(startDate) } },
                              { start_time: { lte: endTime } },
                            ],
                          },
                          {
                            AND: [
                              { end_date: { equals: parseDate(endDate) } },
                              { end_time: { gte: startTime } },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            ],
          },
        },
      };
    }

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

      const where = filterOptions ? this.prepareFilterOptions(filterOptions) : {};

      const orderBy = sortOptions ? this.prepareSortOptions(sortOptions) : {};

      const [roomDetails, total] = await this.databaseService.$transaction([
        this.databaseService.roomDetail.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            amenities: true,
            branch: true,
            translations: true,
          },
        }),
        this.databaseService.roomDetail.count({ where }),
      ]);

      return createPaginatedResponse(
        roomDetails.map((roomDetail) => new RoomDetail(roomDetail)),
        total,
        page,
        pageSize,
      );
    } catch (error) {
      console.error('Find room details error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findById(id: string) {
    try {
      const roomDetail = await this.databaseService.roomDetail.findFirst({
        where: {
          id,
        },
        include: {
          branch: true,
          amenities: true,
          flat_rooms: true,
          translations: true,
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

      return new RoomDetailWithList(roomDetail);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async checkUpdateRoomDetailAvailable(detailId: string) {
    try {
      const roomDetail = await this.findById(detailId);

      let is_available = false;

      for (const room of roomDetail.flat_rooms) {
        if (room.status === 'AVAILABLE' && room.isDeleted === false) {
          is_available = true;
          break;
        }
      }

      if (roomDetail.is_available === is_available) {
        return roomDetail;
      }

      const updatedRoomDetail = await this.databaseService.roomDetail.update({
        where: { id: detailId },
        data: { is_available },
        include: {
          amenities: true,
          flat_rooms: true,
        },
      });

      return new RoomDetailWithList(updatedRoomDetail);
    } catch (error) {
      this.logger.error('RoomDetailService -> checkUpdateRoomDetailAvailable -> error', error);
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
      //   ...(updateRoomDetailDto.branchId && {
      //     branch: { connect: { id: updateRoomDetailDto.branchId } },
      //   }),
    };

    delete updateData.amenityIds;
    delete updateData.branchId;

    return updateData as any;
  }

  async update(id: string, updateRoomDetailDto: UpdateRoomDetailDto) {
    try {
      await this.findById(id);

      if (updateRoomDetailDto.slug) {
        await this.checkSlugExisted(updateRoomDetailDto.slug, updateRoomDetailDto.branchId, id);
      }

      const { translations, ...updateData } = this.prepareUpdateData(updateRoomDetailDto);

      // Update base room detail data
      let updatedRoomDetail = await this.databaseService.roomDetail.update({
        where: { id },
        data: updateData,
        include: {
          amenities: true,
          translations: true,
        },
      });

      // Handle translations if provided
      if (updateRoomDetailDto.translations?.length > 0) {
        const currentTranslations = updatedRoomDetail.translations || [];

        for (const translation of updateRoomDetailDto.translations) {
          const existingTranslation = currentTranslations.find(
            (t) => t.language === translation.language,
          );

          if (existingTranslation) {
            await this.databaseService.roomDetailTranslation.update({
              where: { id: existingTranslation.id },
              data: {
                name: translation.name,
                description: translation.description,
              },
            });
          } else {
            await this.databaseService.roomDetailTranslation.create({
              data: {
                roomDetailId: id,
                language: translation.language,
                name: translation.name,
                description: translation.description,
              },
            });
          }
        }

        // Fetch the updated room detail with translations
        updatedRoomDetail = await this.databaseService.roomDetail.findUnique({
          where: { id },
          include: {
            amenities: true,
            translations: true,
          },
        });
      }

      return new RoomDetail(updatedRoomDetail);
    } catch (error) {
      this.logger.error('RoomDetailService -> update -> error', error);
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

      const where = filterOptions ? this.prepareFilterOptions(filterOptions) : {};

      const orderBy = sortOptions ? this.prepareSortOptions(sortOptions) : {};

      const roomDetails = await this.databaseService.roomDetail.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          amenities: true,
          branch: true,
          translations: true,
        },
      });

      return createInfinityPaginationResponse<RoomDetail>(
        roomDetails.map((roomDetail) => new RoomDetail(roomDetail)),
        { page, limit },
      );
    } catch (error) {
      console.error('Find room details error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.softDelete('roomDetail', id, async () => {
        // Additional checks before soft delete
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
