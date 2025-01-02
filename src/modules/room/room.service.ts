import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { BaseService } from '@/common/services';
import { DatabaseService } from '@/database/database.service';
import { CreateHotelRoomDto, FilterHotelRoomDto, SortHotelRoomDto } from './dtos';
import { CommonErrorMessagesEnum, getPaginationParams, PaginationParams } from 'libs/common';
import { HotelRoom } from './models';

@Injectable()
export class RoomService extends BaseService {
  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService);
  }

  async create(createHotelRoomDto: CreateHotelRoomDto) {
    try {
      const createdRoom = await this.databaseService.hotelRoom.create({
        data: createHotelRoomDto,
      });

      return new HotelRoom(createdRoom);
    } catch (error) {
      console.error('Create room error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findManyPagination(
    paginationOptions: PaginationParams,
    filterOptions: FilterHotelRoomDto,
    sortOptions: SortHotelRoomDto,
  ) {
    const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);
  }
}
