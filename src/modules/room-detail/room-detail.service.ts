import { Injectable, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateRoomDetailDto, UpdateRoomDetailDto } from './dtos/create-update-room-detail.dto';
import { CommonErrorMessagesEnum } from 'libs/common';
import { RoomDetail } from './models';
import { FilterRoomDetailDto } from './dtos/query-room-detail.dto';
import { SortDto } from '@/common/dtos';
import { getPaginationParams, createPaginatedResponse, PaginationParams } from 'libs/common/utils';

@Injectable()
export class RoomDetailService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createRoomDetailDto: CreateRoomDetailDto): Promise<RoomDetail> {
    try {
      const { amenityIds, ...data } = createRoomDetailDto;
      const roomDetail = await this.databaseService.roomDetail.create({
        data: {
          ...data,
          amenities: {
            connect: amenityIds.map(id => ({ id }))
          }
        },
        include: {
          amenities: true
        }
      });

      return new RoomDetail({
        ...roomDetail,
        amenities: roomDetail.amenities.map(amenity => ({
          ...amenity,
          icon: { url: amenity.icon as string, publicId: '' }
        }))
      });
    } catch (error) {
      console.error('Create room detail error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  private transformRoomDetail(roomDetail: any): RoomDetail {
    return new RoomDetail({
      ...roomDetail,
      amenities: roomDetail.amenities?.map(amenity => ({
        ...amenity,
        icon: amenity.icon ? { url: amenity.icon as string, publicId: '' } : null
      }))
    });
  }

  async findMany(
    paginationOptions: PaginationParams,
    filterOptions?: FilterRoomDetailDto,
    sortOptions?: SortDto<'name' | 'room_type' | 'bed_type' | 'createdAt' | 'updatedAt'>[],
  ) {
    try {
      const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);

      const where: any = {
        ...(filterOptions?.keyword
          ? {
              OR: [
                { name: { contains: filterOptions.keyword, mode: 'insensitive' } },
                { description: { contains: filterOptions.keyword, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(filterOptions?.room_type ? { room_type: filterOptions.room_type } : {}),
        ...(filterOptions?.bed_type ? { bed_type: filterOptions.bed_type } : {}),
      };

      const orderBy = sortOptions?.reduce(
        (acc, { orderBy: field, order }) => ({
          ...acc,
          [field]: order.toLowerCase(),
        }),
        {},
      );

      const [roomDetails, total] = await this.databaseService.$transaction([
        this.databaseService.roomDetail.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            amenities: true
          }
        }),
        this.databaseService.roomDetail.count({ where }),
      ]);

      return createPaginatedResponse(
        roomDetails.map((detail) => this.transformRoomDetail(detail)),
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
          amenities: true,
          rooms: true,
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

      return this.transformRoomDetail(roomDetail);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async update(id: string, updateRoomDetailDto: UpdateRoomDetailDto): Promise<RoomDetail> {
    try {
      await this.findById(id);
      const { amenityIds, ...data } = updateRoomDetailDto;

      const updatedRoomDetail = await this.databaseService.roomDetail.update({
        where: { id },
        data: {
          ...data,
          amenities: {
            set: amenityIds.map(id => ({ id }))
          }
        },
        include: {
          amenities: true
        }
      });

      return this.transformRoomDetail(updatedRoomDetail);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.databaseService.$transaction(async (prisma) => {
        const roomDetail = await prisma.roomDetail.findUnique({
          where: { id },
          include: {
            rooms: true,
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

        if (roomDetail.rooms.length > 0) {
          throw new HttpException(
            {
              status: HttpStatus.CONFLICT,
              message: 'Cannot delete room detail with existing rooms',
            },
            HttpStatus.CONFLICT,
          );
        }

        await prisma.roomDetail.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
