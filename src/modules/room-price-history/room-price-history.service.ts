import { DatabaseService } from '@/database/database.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateRoomPriceHistoryDto, UpdateRoomPriceHistoryDto } from './dtos';
import { CommonErrorMessagesEnum } from 'libs/common';
import Decimal from 'decimal.js';
import { RoomPriceHistory } from './models.ts';

@Injectable()
export class RoomPriceHistoryService {
  private readonly logger = new Logger(RoomPriceHistoryService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  // effective_from, effective_to are formatted as 'DD-MM'
  public checkIsDateToApply(effective_from: string, effective_to?: string) {
    const [fromDay, fromMonth] = effective_from.split('-');
    const today = new Date();

    let isDateToApplied = false;

    if (effective_to) {
      const [toDay, toMonth] = effective_to.split('-');

      if (today.getDate() >= Number(fromDay) && today.getDate() <= Number(toDay)) {
        if (today.getMonth() + 1 >= Number(fromMonth) && today.getMonth() + 1 <= Number(toMonth)) {
          isDateToApplied = true;
        }
      }
    } else if (today.getDate() === Number(fromDay) && today.getMonth() + 1 === Number(fromMonth)) {
      isDateToApplied = true;
    }

    return isDateToApplied;
  }

  public async updateRoomDetailPrice(roomDetailId: string, historyId: string) {
    return await this.databaseService.$transaction(async (prisma) => {
      const priceHistory = await prisma.roomPriceHistory.findFirst({
        where: { id: historyId },
      });

      const roomDetail = await prisma.roomDetail.findFirst({
        where: { id: roomDetailId },
      });

      if (!priceHistory || !roomDetail) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            message: 'Price history or room detail not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const tempHourPrice = roomDetail.special_price_per_hour;
      const tempNightPrice = roomDetail.special_price_per_night;
      const tempDayPrice = roomDetail.special_price_per_day;

      await prisma.roomDetail.update({
        where: { id: roomDetailId },
        data: {
          special_price_per_hour: priceHistory.price_per_hour,
          special_price_per_night: priceHistory.price_per_night,
          special_price_per_day: priceHistory.price_per_day,
        },
      });

      await prisma.roomPriceHistory.update({
        where: { id: historyId },
        data: {
          is_applied: !priceHistory.is_applied,
          price_per_hour: tempHourPrice,
          price_per_night: tempNightPrice,
          price_per_day: tempDayPrice,
        },
      });
    });
  }

  async create(createDto: CreateRoomPriceHistoryDto) {
    try {
      const { price_per_hour, price_per_night, price_per_day, ...data } = createDto;

      if (!price_per_hour && !price_per_night && !price_per_day) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            message: 'At least one price must be provided',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const priceHistory = await this.databaseService.roomPriceHistory.create({
        data: {
          ...data,
          price_per_hour: new Decimal(price_per_hour),
          price_per_night: new Decimal(price_per_night),
          price_per_day: new Decimal(price_per_day),
        },
      });

      const isDateToApplied = this.checkIsDateToApply(
        priceHistory.effective_from,
        priceHistory.effective_to,
      );

      if (isDateToApplied) {
        await this.updateRoomDetailPrice(data.roomDetailId, priceHistory.id);
      }

      return new RoomPriceHistory(priceHistory);
    } catch (error) {
      this.logger.error('RoomPriceHistoryService -> create -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findById(id: string) {
    try {
      const priceHistory = await this.databaseService.roomPriceHistory.findFirst({
        where: { id },
      });

      if (!priceHistory) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            message: 'Price history not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return new RoomPriceHistory(priceHistory);
    } catch (error) {
      this.logger.error('RoomPriceHistoryService -> findById -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async update(id: string, updateDto: UpdateRoomPriceHistoryDto) {
    try {
      await this.findById(id);

      const { price_per_hour, price_per_night, price_per_day, ...data } = updateDto;

      const priceHistory = await this.databaseService.roomPriceHistory.update({
        where: { id },
        data: {
          ...data,
          price_per_hour: new Decimal(price_per_hour),
          price_per_night: new Decimal(price_per_night),
          price_per_day: new Decimal(price_per_day),
        },
      });

      const isDateToApplied = this.checkIsDateToApply(
        priceHistory.effective_from,
        priceHistory.effective_to,
      );

      if (isDateToApplied) {
        await this.updateRoomDetailPrice(priceHistory.roomDetailId, id);
      }

      return new RoomPriceHistory(priceHistory);
    } catch (error) {
      this.logger.error('RoomPriceHistoryService -> update -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findMany(roomDetailId: string) {
    try {
      const priceHistories = await this.databaseService.roomPriceHistory.findMany({
        where: { roomDetailId },
      });

      return priceHistories.map((priceHistory) => new RoomPriceHistory(priceHistory));
    } catch (error) {
      this.logger.error('RoomPriceHistoryService -> findMany -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async remove(id: string) {
    try {
      const priceHistory = await this.findById(id);

      if (priceHistory.is_applied) {
        await this.updateRoomDetailPrice(priceHistory.roomDetailId, id);
      }

      await this.databaseService.roomPriceHistory.delete({ where: { id } });
    } catch (error) {
      this.logger.error('RoomPriceHistoryService -> remove -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
