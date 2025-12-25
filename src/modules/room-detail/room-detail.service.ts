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
import { BookingStatus, HotelRoomStatus } from '@prisma/client';

/** Represents a map of detailId to Set of booked roomIds */
type BookedRoomsByDetailMap = Map<string, Set<string>>;

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

  /**
   * Fetches overlapping bookings for the given time range and returns a map of detailId -> Set of booked roomIds.
   * This is the core of the 2-query optimization approach.
   */
  private async getOverlappingBookedRoomIds(
    startDate: string,
    endDate: string,
    startTime: string,
    endTime: string,
  ): Promise<BookedRoomsByDetailMap> {
    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate);

    const overlappingBookings = await this.databaseService.booking.findMany({
      where: {
        status: {
          in: [BookingStatus.PENDING, BookingStatus.WAITING_FOR_CHECK_IN, BookingStatus.CHECKED_IN],
        },
        isDeleted: false,
        OR: [
          // Date range overlap: booking dates overlap with search dates
          {
            AND: [{ start_date: { lte: parsedEndDate } }, { end_date: { gte: parsedStartDate } }],
          },
        ],
      },
      select: {
        roomId: true,
        start_date: true,
        end_date: true,
        start_time: true,
        end_time: true,
        room: {
          select: {
            detailId: true,
          },
        },
      },
    });

    // Filter bookings that actually overlap with the requested time slot
    const bookedRoomsByDetail: BookedRoomsByDetailMap = new Map();

    for (const booking of overlappingBookings) {
      const bookingStartDate = booking.start_date;
      const bookingEndDate = booking.end_date;

      // Check if there's actual time overlap
      const hasTimeOverlap = this.checkTimeOverlap(
        parsedStartDate,
        parsedEndDate,
        startTime,
        endTime,
        bookingStartDate,
        bookingEndDate,
        booking.start_time,
        booking.end_time,
      );

      if (hasTimeOverlap) {
        const detailId = booking.room.detailId;
        if (!bookedRoomsByDetail.has(detailId)) {
          bookedRoomsByDetail.set(detailId, new Set());
        }
        bookedRoomsByDetail.get(detailId).add(booking.roomId);
      }
    }

    return bookedRoomsByDetail;
  }

  /**
   * Checks if two booking time ranges overlap.
   * Handles the complex logic of date + time overlap checking.
   */
  private checkTimeOverlap(
    searchStartDate: Date,
    searchEndDate: Date,
    searchStartTime: string,
    searchEndTime: string,
    bookingStartDate: Date,
    bookingEndDate: Date,
    bookingStartTime: string,
    bookingEndTime: string,
  ): boolean {
    // Normalize dates to compare just the date part
    const searchStart = searchStartDate.getTime();
    const searchEnd = searchEndDate.getTime();
    const bookingStart = bookingStartDate.getTime();
    const bookingEnd = bookingEndDate.getTime();

    // No date overlap at all
    if (bookingEnd < searchStart || bookingStart > searchEnd) {
      return false;
    }

    // If dates span multiple days, there's definitely overlap in middle days
    if (bookingStart < searchStart && bookingEnd > searchEnd) {
      return true;
    }

    // Same day booking - need to check time overlap
    if (bookingStart === searchStart && bookingEnd === searchEnd && searchStart === searchEnd) {
      // Both are same single day - check time overlap
      // Times are in HH:mm format
      return !(bookingEndTime <= searchStartTime || bookingStartTime >= searchEndTime);
    }

    // Partial date overlap - check edge cases
    // If booking ends on search start date, check if booking end time > search start time
    if (bookingEnd === searchStart && bookingStart < searchStart) {
      return bookingEndTime > searchStartTime;
    }

    // If booking starts on search end date, check if booking start time < search end time
    if (bookingStart === searchEnd && bookingEnd > searchEnd) {
      return bookingStartTime < searchEndTime;
    }

    // If search ends on booking start date
    if (searchEnd === bookingStart && searchStart < bookingStart) {
      return searchEndTime > bookingStartTime;
    }

    // If search starts on booking end date
    if (searchStart === bookingEnd && searchEnd > bookingEnd) {
      return searchStartTime < bookingEndTime;
    }

    // For other overlapping cases (middle days), there's overlap
    return true;
  }

  /**
   * Calculates available rooms count for a room detail based on overlapping bookings.
   */
  private calculateAvailableRoomsCount(
    flatRooms: Array<{ id: string; status: HotelRoomStatus; isDeleted: boolean }>,
    bookedRoomIds: Set<string> | undefined,
  ): number {
    // Get rooms that are eligible (not deleted, not in maintenance)
    const eligibleRooms = flatRooms.filter(
      (room) => !room.isDeleted && room.status !== HotelRoomStatus.MAINTENANCE,
    );

    if (!bookedRoomIds || bookedRoomIds.size === 0) {
      return eligibleRooms.length;
    }

    // Count rooms that are not in the booked set
    return eligibleRooms.filter((room) => !bookedRoomIds.has(room.id)).length;
  }

  /**
   * Common include options for room detail queries with availability calculation.
   */
  private readonly roomDetailWithAvailabilityInclude = {
    amenities: true,
    branch: true,
    translations: true,
    flat_rooms: {
      where: { isDeleted: false },
      select: {
        id: true,
        status: true,
        isDeleted: true,
      },
    },
  } as const;

  /**
   * Processes room details to calculate availability and filter out fully booked ones.
   * This is the common logic shared between findMany and findManyInfinite.
   */
  private processRoomDetailsWithAvailability(
    roomDetails: Array<any>,
    bookedRoomsByDetail: BookedRoomsByDetailMap,
    hasTimeFilter: boolean,
  ): RoomDetail[] {
    return roomDetails
      .map((roomDetail) => {
        const bookedRoomIds = bookedRoomsByDetail.get(roomDetail.id);
        const availableRoomsCount = this.calculateAvailableRoomsCount(
          roomDetail.flat_rooms,
          bookedRoomIds,
        );

        // Destructure flat_rooms as it's only used for availability calculation
        const { flat_rooms, ...roomDetailData } = roomDetail;

        return {
          roomDetailData,
          availableRoomsCount,
        };
      })
      .filter(({ availableRoomsCount }) => {
        // If time filter is provided, only return room types with available rooms
        return !hasTimeFilter || availableRoomsCount > 0;
      })
      .map(
        ({ roomDetailData, availableRoomsCount }) =>
          new RoomDetail(roomDetailData, {
            availableRoomsCount: hasTimeFilter ? availableRoomsCount : undefined,
          }),
      );
  }

  /**
   * Gets overlapping bookings map if time filter is provided, otherwise returns empty map.
   */
  private async getBookedRoomsMapIfNeeded(
    filterOptions?: FilterRoomDetailDto,
  ): Promise<{ bookedRoomsByDetail: BookedRoomsByDetailMap; hasTimeFilter: boolean }> {
    const hasTimeFilter = !!(
      filterOptions?.startDate &&
      filterOptions?.endDate &&
      filterOptions?.startTime &&
      filterOptions?.endTime
    );

    if (!hasTimeFilter) {
      return { bookedRoomsByDetail: new Map(), hasTimeFilter: false };
    }

    const bookedRoomsByDetail = await this.getOverlappingBookedRoomIds(
      filterOptions.startDate,
      filterOptions.endDate,
      filterOptions.startTime,
      filterOptions.endTime,
    );

    return { bookedRoomsByDetail, hasTimeFilter };
  }

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
      adults,
      children,
      bookingType,
    } = filterOptions;

    const where: any = {
      // Ensure room detail has at least one active room
      flat_rooms: {
        some: {
          isDeleted: false,
          status: { not: HotelRoomStatus.MAINTENANCE },
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
          ...(bookingType === 'HOURLY' && {
            base_price_per_hour: { gte: minPrice, lte: maxPrice },
          }),
          ...(bookingType === 'NIGHTLY' && {
            base_price_per_night: { gte: minPrice, lte: maxPrice },
          }),
          ...(bookingType === 'DAILY' && {
            base_price_per_day: { gte: minPrice, lte: maxPrice },
          }),
        }),
    };

    // Note: Date/time filtering is now handled separately via getOverlappingBookedRoomIds
    // and post-query filtering to calculate availableRoomsCount

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

      // Get overlapping bookings if time filter is provided
      const { bookedRoomsByDetail, hasTimeFilter } =
        await this.getBookedRoomsMapIfNeeded(filterOptions);

      // Fetch room details with flat_rooms for availability calculation
      const [roomDetails, total] = await this.databaseService.$transaction([
        this.databaseService.roomDetail.findMany({
          where,
          skip,
          take,
          orderBy,
          include: this.roomDetailWithAvailabilityInclude,
        }),
        this.databaseService.roomDetail.count({ where }),
      ]);

      // Process room details with availability calculation
      const processedRoomDetails = this.processRoomDetailsWithAvailability(
        roomDetails,
        bookedRoomsByDetail,
        hasTimeFilter,
      );

      return createPaginatedResponse(
        processedRoomDetails,
        hasTimeFilter ? processedRoomDetails.length : total,
        page,
        pageSize,
      );
    } catch (error) {
      this.logger.error('RoomDetailService -> findMany -> error', error);
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

      return await this.databaseService.$transaction(async (tx) => {
        // Update base room detail data
        let updatedRoomDetail = await tx.roomDetail.update({
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
          const translationPromises = [];

          for (const translation of updateRoomDetailDto.translations) {
            const existingTranslation = currentTranslations.find(
              (t) => t.language === translation.language,
            );

            if (existingTranslation) {
              translationPromises.push(
                tx.roomDetailTranslation.update({
                  where: { id: existingTranslation.id },
                  data: {
                    name: translation.name,
                    description: translation.description,
                  },
                }),
              );
            } else {
              translationPromises.push(
                tx.roomDetailTranslation.create({
                  data: {
                    roomDetailId: id,
                    language: translation.language,
                    name: translation.name,
                    description: translation.description,
                  },
                }),
              );
            }
          }

          await Promise.all(translationPromises);

          // Fetch the updated room detail with translations
          updatedRoomDetail = await tx.roomDetail.findUnique({
            where: { id },
            include: {
              amenities: true,
              translations: true,
            },
          });
        }

        return new RoomDetail(updatedRoomDetail);
      });
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

      // Get overlapping bookings if time filter is provided
      const { bookedRoomsByDetail, hasTimeFilter } =
        await this.getBookedRoomsMapIfNeeded(filterOptions);

      // Fetch room details with flat_rooms for availability calculation
      const roomDetails = await this.databaseService.roomDetail.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.roomDetailWithAvailabilityInclude,
      });

      // Process room details with availability calculation
      const processedRoomDetails = this.processRoomDetailsWithAvailability(
        roomDetails,
        bookedRoomsByDetail,
        hasTimeFilter,
      );

      return createInfinityPaginationResponse<RoomDetail>(processedRoomDetails, { page, limit });
    } catch (error) {
      this.logger.error('RoomDetailService -> findManyInfinite -> error', error);
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
