import { BaseService } from '@/common/services';
import { DatabaseService } from '@/database/database.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CreateBookingAtHotelDto,
  CreateBookingOnlineDto,
  PrepareBookingDto,
  SelectBookingTimeDto,
} from './dtos';
import {
  BookingErrorMessagesEnum,
  CommonErrorMessagesEnum,
  RoomErrorMessagesEnum,
} from 'libs/common';
import Decimal from 'decimal.js';
import { RoomDetailService } from '@/modules/room-detail/room-detail.service';
import { RoomService } from '@/modules/room/room.service';
import { BookingType, HotelRoomStatus } from '@prisma/client';
import { Booking } from './models';
import { RoomDetail } from '../room-detail/models';

@Injectable()
export class BookingService extends BaseService {
  constructor(
    protected readonly databaseService: DatabaseService,
    private readonly roomDetailService: RoomDetailService,
    private readonly roomService: RoomService,
  ) {
    super(databaseService);
  }

  formatStringDate(dateString: string): Date {
    // Split the date string into parts (assuming format "DD-MM-YYYY")
    const [day, month, year] = dateString.split('-').map((num) => parseInt(num, 10));

    // Create a new Date object with UTC time set to midnight
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    return date;
  }

  private generateBookingCode(): string {
    // Generate a random 9-digit number
    const code = Math.floor(100000000 + Math.random() * 900000000).toString();

    return code;
  }

  private calculateHours(start_time: string, end_time) {
    // the start_time and end_time are in the format "HH:MM"
    const [start_hour, start_minute] = start_time.split(':').map((num) => parseInt(num, 10));
    const [end_hour, end_minute] = end_time.split(':').map((num) => parseInt(num, 10));

    // Calculate the total hours
    const total_hours = end_hour - start_hour + (end_minute - start_minute) / 60;

    return total_hours;
  }

  private calculateDays(start_date: string, end_date: string) {
    // the start_date and end_date are in the format "DD-MM-YYYY"
    const start = this.formatStringDate(start_date);
    const end = this.formatStringDate(end_date);

    // Calculate the total days
    const total_days = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);

    return total_days;
  }

  private calculateTotalAmount(
    selectTimeDto: SelectBookingTimeDto,
    type: BookingType,
    room: RoomDetail,
  ) {
    const { start_date, end_date, start_time, end_time } = selectTimeDto;
    const {
      base_price_per_hour,
      special_price_per_hour,
      base_price_per_night,
      special_price_per_night,
      base_price_per_day,
      special_price_per_day,
    } = room;

    // Calculate the total amount
    let total_amount: Decimal;

    switch (type) {
      case BookingType.HOURLY: {
        const total_hours = this.calculateHours(start_time, end_time);
        total_amount = new Decimal(special_price_per_hour ?? base_price_per_hour).mul(total_hours);
        break;
      }

      case BookingType.DAILY: {
        const total_days = this.calculateDays(start_date, end_date);
        total_amount = new Decimal(special_price_per_day ?? base_price_per_day).mul(total_days);
        break;
      }

      case BookingType.NIGHTLY: {
        total_amount = new Decimal(special_price_per_night ?? base_price_per_night);
        break;
      }

      default:
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Invalid booking type',
          },
          HttpStatus.BAD_REQUEST,
        );
    }

    return total_amount;
  }

  async createOnline(createDto: CreateBookingOnlineDto, prepareDto: PrepareBookingDto) {
    try {
      const {
        detailId,
        start_date,
        end_date,
        start_time,
        end_time,
        guest_details,
        ...createBookingDto
      } = createDto;

      const currentRoomDetail = await this.roomDetailService.findById(detailId);

      // check number of guests
      if (createDto.number_of_guests > currentRoomDetail.max_adults) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: BookingErrorMessagesEnum.maximumGuestsExceeded,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const firstAvailableRoom = await this.databaseService.hotelRoom.findFirst({
        where: {
          detailId,
          status: HotelRoomStatus.AVAILABLE,
          isDeleted: false,
        },
      });

      if (!firstAvailableRoom) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: RoomErrorMessagesEnum.NotFound,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const total_amount = this.calculateTotalAmount(
        { start_date, end_date, start_time, end_time },
        prepareDto.type,
        currentRoomDetail,
      );

      const booking = await this.databaseService.booking.create({
        data: {
          code: this.generateBookingCode(),
          ...prepareDto,
          ...createBookingDto,
          roomId: firstAvailableRoom.id,
          start_date: this.formatStringDate(start_date),
          end_date: this.formatStringDate(end_date),
          start_time,
          end_time,
          total_amount,
          guest_details: guest_details as any,
        },
      });

      return new Booking(booking as any);
    } catch (error) {
      console.error('BookingService -> createOnline -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async createAtHotel(createDto: CreateBookingAtHotelDto, prepareDto: PrepareBookingDto) {
    try {
      const currentRoom = await this.roomService.findById(createDto.roomId);

      if (currentRoom.status !== HotelRoomStatus.AVAILABLE) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: RoomErrorMessagesEnum.NotFound,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      const { start_date, end_date, start_time, end_time, guest_details, ...createBookingDto } =
        createDto;

      const total_amount = this.calculateTotalAmount(
        {
          start_date,
          end_date,
          start_time,
          end_time,
        },
        prepareDto.type,
        currentRoom.detail,
      );

      const booking = await this.databaseService.booking.create({
        data: {
          code: this.generateBookingCode(),
          ...prepareDto,
          ...createBookingDto,
          start_date: this.formatStringDate(start_date),
          end_date: this.formatStringDate(end_date),
          start_time,
          end_time,
          total_amount,
          guest_details: guest_details as any,
        },
      });

      return new Booking(booking as any);
    } catch (error) {
      console.error('BookingService -> createAtHotel -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
