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
      const { price_per_hour, price_per_night, price_per_day, translations, ...data } = createDto;

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
          price_per_hour,
          price_per_night,
          price_per_day,
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
          translations: true,
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
        include: {
          translations: true,
        },
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

      const { translations, ...data } = updateDto;

      // Update base price history data
      let updatedPriceHistory = await this.databaseService.roomPriceHistory.update({
        where: { id },
        data,
        include: {
          translations: true,
        },
      });

      // Handle translations if provided
      if (translations?.length > 0) {
        const currentTranslations = updatedPriceHistory.translations || [];

        for (const translation of translations) {
          const existingTranslation = currentTranslations.find(
            (t) => t.language === translation.language,
          );

          if (existingTranslation) {
            await this.databaseService.roomPriceHistoryTranslation.update({
              where: { id: existingTranslation.id },
              data: {
                name: translation.name,
                description: translation.description,
              },
            });
          } else {
            await this.databaseService.roomPriceHistoryTranslation.create({
              data: {
                roomPriceHistoryId: id,
                language: translation.language,
                name: translation.name,
                description: translation.description,
              },
            });
          }
        }

        // Fetch the updated price history with translations
        updatedPriceHistory = await this.databaseService.roomPriceHistory.findUnique({
          where: { id },
          include: {
            translations: true,
          },
        });
      }

      const isDateToApplied = this.checkIsDateToApply(
        updatedPriceHistory.effective_from,
        updatedPriceHistory.effective_to,
      );

      if (isDateToApplied) {
        await this.updateRoomDetailPrice(updatedPriceHistory.roomDetailId, id);
      }

      return new RoomPriceHistory(updatedPriceHistory);
    } catch (error) {
      this.logger.error('RoomPriceHistoryService -> update -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findMany(roomDetailId: string) {
    try {
      const priceHistories = await this.databaseService.roomPriceHistory.findMany({
        where: { roomDetailId },
        include: {
          translations: true,
        },
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

      // Delete translations first
      await this.databaseService.roomPriceHistoryTranslation.deleteMany({
        where: { roomPriceHistoryId: id },
      });

      // Then delete the price history
      await this.databaseService.roomPriceHistory.delete({ where: { id } });
    } catch (error) {
      this.logger.error('RoomPriceHistoryService -> remove -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
