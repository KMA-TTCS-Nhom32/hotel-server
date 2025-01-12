import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '@/database/database.service';
import { RoomPriceHistoryService } from '../room-price-history.service';

@Injectable()
export class PriceUpdateCronService {
  private readonly logger = new Logger(PriceUpdateCronService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly roomPriceHistoryService: RoomPriceHistoryService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handlePriceUpdates() {
    this.logger.log('Starting daily price update check...');

    try {
      const priceHistories = await this.databaseService.roomPriceHistory.findMany();

      for (const history of priceHistories) {
        const shouldBeApplied = this.roomPriceHistoryService.checkIsDateToApply(
          history.effective_from,
          history.effective_to,
        );

        // If current application state doesn't match what it should be, update it
        if (shouldBeApplied !== history.is_applied) {
          await this.roomPriceHistoryService.updateRoomDetailPrice(history.roomDetailId, history.id);
          this.logger.log(
            `${shouldBeApplied ? 'Applied' : 'Reverted'} special prices for history ${history.id}`,
          );
        }
      }

      this.logger.log('Completed daily price update check');
    } catch (error) {
      this.logger.error('Error in price update cron job:', error);
    }
  }
}
