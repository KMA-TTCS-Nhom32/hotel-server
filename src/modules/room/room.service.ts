import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { BaseService } from '@/common/services';
import { DatabaseService } from '@/database/database.service';
import {
  CreateHotelRoomDto,
  FilterHotelRoomDto,
  SortHotelRoomDto,
  UpdateHotelRoomDto,
} from './dtos';
import {
  CommonErrorMessagesEnum,
  createPaginatedResponse,
  getPaginationParams,
  PaginationParams,
  RoomErrorMessagesEnum,
} from 'libs/common';
import { HotelRoom } from './models';
import { HotelRoomStatus } from '@prisma/client';
import { RoomDetailService } from '../room-detail/room-detail.service';

@Injectable()
export class RoomService extends BaseService {
  private readonly logger = new Logger(RoomService.name);

  constructor(
    protected readonly databaseService: DatabaseService,
    private readonly roomDetailService: RoomDetailService,
  ) {
    super(databaseService);
  }

  private async checkSlugExisted(slug: string, detailId: string, currentId?: string) {
    const room = await this.databaseService.hotelRoom.findFirst({
      where: { slug, detailId, id: { not: currentId } },
    });

    if (room) {
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          message: 'Room with this slug already exists',
        },
        HttpStatus.CONFLICT,
      );
    }
  }

  async create(createHotelRoomDto: CreateHotelRoomDto) {
    try {
      await this.checkSlugExisted(createHotelRoomDto.slug, createHotelRoomDto.detailId);

      const createdRoom = await this.databaseService.hotelRoom.create({
        data: {
          ...createHotelRoomDto,
          translations: {
            create: createHotelRoomDto.translations
              ? createHotelRoomDto.translations.map((t) => ({
                  language: t.language,
                  name: t.name,
                }))
              : [],
          },
        },
        include: {
          translations: true,
        },
      });

      return new HotelRoom(createdRoom);
    } catch (error) {
      console.error('Create room error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findById(id: string) {
    try {
      const room = await this.databaseService.hotelRoom.findUnique({
        where: { id },
        include: {
          // detail: true,
          bookings: true,
          translations: true,
        },
      });

      if (!room) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            message: RoomErrorMessagesEnum.NotFound,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return new HotelRoom(room);
    } catch (error) {
      console.error('Find room by ID error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  private prepareFilterOptions(filterOptions: FilterHotelRoomDto) {
    const { keyword, detailId, detailSlug, status } = filterOptions;

    const where: any = {
      ...(keyword && {
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { slug: { contains: keyword, mode: 'insensitive' } },
        ],
      }),
      ...(status && { status }),
      ...(detailId && { detailId }),
      ...(detailSlug && { detail: { slug: detailSlug } }),
      detail: { isDeleted: false },
    };

    return this.mergeWithBaseWhere(where);
  }

  private prepareSortOptions(sortOptions: SortHotelRoomDto[]) {
    return sortOptions.reduce(
      (acc, { orderBy: field, order }) => ({
        ...acc,
        [field]: order.toLowerCase(),
      }),
      {},
    );
  }

  async findManyPagination(
    paginationOptions: PaginationParams,
    filterOptions: FilterHotelRoomDto,
    sortOptions: SortHotelRoomDto[],
  ) {
    try {
      const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);

      const where = this.prepareFilterOptions(filterOptions);

      const orderBy = this.prepareSortOptions(sortOptions);

      const [rooms, total] = await this.databaseService.$transaction([
        this.databaseService.hotelRoom.findMany({
          where,
          orderBy,
          skip,
          take,
          include: {
            _count: {
              select: { bookings: true },
            },
            // detail: true,
            translations: true,
          },
        }),
        this.databaseService.hotelRoom.count({ where }),
      ]);

      return createPaginatedResponse(
        rooms.map((room) => new HotelRoom(room)),
        total,
        page,
        pageSize,
      );
    } catch (error) {
      console.error('Find many room error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findManyByBranchId(branchId: string) {
    try {
      const rooms = await this.databaseService.hotelRoom.findMany({
        where: this.mergeWithBaseWhere({ detail: { branchId, isDeleted: false } }),
        include: {
          _count: {
            select: { bookings: true },
          },
          // detail: true,
          translations: true,
        },
      });

      return rooms.map((room) => new HotelRoom(room));
    } catch (error) {
      this.logger.error('RoomService -> findManyByBranchId -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async update(id: string, updateHotelRoomDto: UpdateHotelRoomDto) {
    try {
      const roomToUpdate = await this.findById(id);

      if (updateHotelRoomDto.slug) {
        await this.checkSlugExisted(updateHotelRoomDto.slug, roomToUpdate.detailId, id);
      }

      if (updateHotelRoomDto.status === HotelRoomStatus.MAINTENANCE) {
        await this.roomDetailService.checkUpdateRoomDetailAvailable(roomToUpdate.detailId);
      }

      const updatedRoom = await this.databaseService.$transaction(async (prisma) => {
        // Update base room data
        let room = await prisma.hotelRoom.update({
          where: { id },
          data: {
            name: updateHotelRoomDto.name,
            slug: updateHotelRoomDto.slug,
            status: updateHotelRoomDto.status,
          },
          include: {
            translations: true,
          },
        });

        // Handle translations if provided
        if (updateHotelRoomDto.translations?.length > 0) {
          const currentTranslations = room.translations || [];

          for (const translation of updateHotelRoomDto.translations) {
            const existingTranslation = currentTranslations.find(
              (t) => t.language === translation.language,
            );

            if (existingTranslation) {
              await prisma.hotelRoomTranslation.update({
                where: { id: existingTranslation.id },
                data: { name: translation.name },
              });
            } else {
              await prisma.hotelRoomTranslation.create({
                data: {
                  roomId: id,
                  language: translation.language,
                  name: translation.name,
                },
              });
            }
          }

          // Fetch the updated room with translations
          room = await prisma.hotelRoom.findUnique({
            where: { id },
            include: {
              translations: true,
            },
          });
        }

        return room;
      });

      return new HotelRoom(updatedRoom);
    } catch (error) {
      console.error('Update room error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.softDelete('hotelRoom', id, async () => {
        const room = await this.databaseService.hotelRoom.findUnique({
          where: { id },
          include: {
            bookings: {
              where: {
                status: {
                  in: ['PENDING', 'WAITING_FOR_CHECK_IN', 'CHECKED_IN'],
                },
              },
            },
          },
        });

        if (!room) {
          throw new HttpException(
            { status: HttpStatus.NOT_FOUND, message: RoomErrorMessagesEnum.NotFound },
            HttpStatus.NOT_FOUND,
          );
        }

        if (room.bookings.length > 0) {
          throw new HttpException(
            {
              status: HttpStatus.CONFLICT,
              message: 'Cannot delete room with active bookings',
            },
            HttpStatus.CONFLICT,
          );
        }

        await this.roomDetailService.checkUpdateRoomDetailAvailable(room.detailId);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async restore(id: string) {
    try {
      const restoredRoom = await this.restoreDeleted<HotelRoom>('hotelRoom', id);
      await this.roomDetailService.checkUpdateRoomDetailAvailable(restoredRoom.detailId);

      return {
        success: true,
        message: 'Room restored successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findDeleted(): Promise<HotelRoom[]> {
    try {
      const deletedRooms = await this.databaseService.hotelRoom.findMany({
        where: { isDeleted: true },
      });

      return deletedRooms.map((room) => new HotelRoom(room));
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async immediateDelete(ids: string[]) {
    try {
      let isValidToProceed = true;
      for (const id of ids) {
        const room = await this.findById(id);

        if (!room.isDeleted) {
          isValidToProceed = false;
          break;
        }
      }

      if (!isValidToProceed) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            message: 'Cannot permantly remove non-deleted rooms',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      await this.databaseService.hotelRoom.deleteMany({
        where: { id: { in: ids }, isDeleted: true },
      });
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
