import { BaseService } from '@/common/services';
import { DatabaseService } from '@/database/database.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  CancelBookingDto,
  CreateBookingAtHotelDto,
  CreateBookingOnlineDto,
  FilterBookingsDto,
  FilterMyBookingsDto,
  PrepareBookingDto,
  SelectBookingTimeDto,
  SortBookingsDto,
  UpdateBookingDto,
} from './dtos';
import {
  BookingErrorMessagesEnum,
  CommonErrorMessagesEnum,
  createPaginatedResponse,
  getPaginationParams,
  PaginationParams,
  RoomErrorMessagesEnum,
} from 'libs/common';
import Decimal from 'decimal.js';
import { RoomDetailService } from '@/modules/room-detail/room-detail.service';
import { RoomService } from '@/modules/room/room.service';
import { BookingStatus, BookingType, HotelRoomStatus } from '@prisma/client';
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

  private readonly baseBookingInclude = {
    room: {
      select: {
        id: true,
        slug: true,
        name: true,
      },
      include: {
        detail: {
          select: {
            id: true,
            slug: true,
            name: true,
            thumnail: true,
          },
          include: {
            branch: {
              select: {
                id: true,
                slug: true,
                name: true,
                address: true,
              },
              include: {
                province: {
                  select: {
                    id: true,
                    slug: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  formatStringDate(dateString: string): Date {
    // Split the date string into parts (assuming format "DD-MM-YYYY")
    const [day, month, year] = dateString.split('-').map((num) => parseInt(num, 10));

    // Create a new Date object with UTC time set to midnight
    const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    return date;
  }

  private async generateBookingCode(): Promise<string> {
    // Generate a random 9-digit number
    const code = Math.floor(100000000 + Math.random() * 900000000).toString();

    // Check if the code already exists
    const booking = await this.databaseService.booking.findFirst({
      where: { code },
    });

    // If the code already exists, generate a new one
    if (booking) {
      return this.generateBookingCode();
    }

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

  private calculateTotalAmount(selectTimeDto: SelectBookingTimeDto, room: RoomDetail) {
    const { type, start_date, end_date, start_time, end_time } = selectTimeDto;
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
        type,
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
            error: BookingErrorMessagesEnum.MaxPriceaximumGuestsExceeded,
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
        {
          type,
          start_date,
          end_date,
          start_time,
          end_time,
        },
        currentRoomDetail,
      );

      const code = await this.generateBookingCode();

      const booking = await this.databaseService.booking.create({
        data: {
          code,
          type,
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

      const {
        type,
        start_date,
        end_date,
        start_time,
        end_time,
        guest_details,
        ...createBookingDto
      } = createDto;

      const total_amount = this.calculateTotalAmount(
        {
          type,
          start_date,
          end_date,
          start_time,
          end_time,
        },
        currentRoom.detail,
      );

      const code = await this.generateBookingCode();

      const booking = await this.databaseService.booking.create({
        data: {
          code,
          type,
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

  async findById(id: string) {
    try {
      const booking = await this.databaseService.booking.findUnique({
        where: { id },
        include: {
          room: {
            include: {
              detail: {
                include: {
                  branch: {
                    include: {
                      province: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!booking) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: BookingErrorMessagesEnum.NotFound,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return new Booking(booking as any);
    } catch (error) {
      console.error('BookingService -> findById -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async getMyBookings(
    myId: string,
    paginationOptions?: PaginationParams,
    filterOptions?: FilterMyBookingsDto,
  ) {
    try {
      const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);

      const where = this.mergeWithBaseWhere({
        userId: myId,
        ...(filterOptions?.status && { status: { in: filterOptions.status } }),
      });

      const [bookings, total] = await this.databaseService.$transaction([
        this.databaseService.booking.findMany({
          where,
          orderBy: {
            updatedAt: 'desc',
          },
          skip,
          take,
          include: this.baseBookingInclude,
        }),
        this.databaseService.booking.count({ where }),
      ]);

      return createPaginatedResponse(
        bookings.map((booking) => new Booking(booking as any)),
        total,
        page,
        pageSize,
      );
    } catch (error) {
      console.error('BookingService -> getMyBookings -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  private prepareFilterOptions(filterOptions: FilterBookingsDto) {
    const {
      keyword,
      type,
      branchId,
      detailId,
      roomId,
      status,
      start_date,
      end_date,
      payment_method,
      payment_status,
      userId,
    } = filterOptions;

    const where: any = {
      ...(keyword && {
        OR: [
          {
            room: {
              detail: { name: { contains: keyword, mode: 'insensitive' } },
            },
          },
          {
            room: {
              detail: {
                branch: { name: { contains: keyword, mode: 'insensitive' } },
              },
            },
          },
          {
            room: {
              detail: {
                branch: {
                  province: { name: { contains: keyword, mode: 'insensitive' } },
                },
              },
            },
          },
        ],
      }),
      ...(type && { type }),
      ...(roomId && { roomId }),
      ...(detailId && { room: { detailId } }),
      ...(branchId && { room: { detail: { branchId } } }),
      ...(status && { status }),
      ...(payment_status && { payment_status }),
      ...(payment_method && { payment_method }),
      ...(userId && { userId }),
      ...(start_date && {
        start_date: {
          gte: this.formatStringDate(start_date),
        },
      }),
      ...(end_date && {
        end_date: {
          lte: this.formatStringDate(end_date),
        },
      }),
    };

    return this.mergeWithBaseWhere(where);
  }

  private prepareSortOptions(sortOptions: SortBookingsDto[]) {
    return sortOptions.reduce(
      (acc, { orderBy: field, order }) =>
        field !== 'branchName'
          ? {
              ...acc,
              [field]: order.toLowerCase(),
            }
          : {
              detail: {
                branch: {
                  name: order.toLowerCase(),
                },
              },
            },
      {},
    );
  }

  async findMany(
    paginationOptions: PaginationParams,
    filterOptions?: FilterBookingsDto,
    sortOptions?: SortBookingsDto[],
  ) {
    try {
      const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);

      const where = this.prepareFilterOptions(filterOptions);

      const orderBy = this.prepareSortOptions(sortOptions);

      const [bookings, total] = await this.databaseService.$transaction([
        this.databaseService.booking.findMany({
          where,
          orderBy,
          skip,
          take,
          include: this.baseBookingInclude,
        }),
        this.databaseService.booking.count({ where }),
      ]);

      return createPaginatedResponse(
        bookings.map((booking) => new Booking(booking as any)),
        total,
        page,
        pageSize,
      );
    } catch (error) {
      console.error('BookingService -> findMany -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  private prepareUpdateData(updateDto: UpdateBookingDto) {
    const updateData = {
      ...updateDto,
      ...(updateDto.start_date && {
        start_date: this.formatStringDate(updateDto.start_date),
      }),
      ...(updateDto.end_date && {
        end_date: this.formatStringDate(updateDto.end_date),
      }),
      ...(updateDto.roomId && {
        room: { connect: { id: updateDto.roomId } },
      }),
    };

    delete updateData.roomId;

    return updateData as any;
  }

  async update(id: string, updateDto: UpdateBookingDto) {
    try {
      await this.findById(id);

      const updatedBooking = await this.databaseService.booking.update({
        where: { id },
        data: this.prepareUpdateData(updateDto),
        include: {
          room: true,
        },
      });

      return new Booking(updatedBooking as any);
    } catch (error) {
      console.error('BookingService -> update -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async updateStatus(id: string, status: BookingStatus) {
    try {
      await this.findById(id);

      const updatedBooking = await this.databaseService.booking.update({
        where: { id },
        data: { status },
        include: {
          room: true,
        },
      });

      return new Booking(updatedBooking as any);
    } catch (error) {
      console.error('BookingService -> updateStatus -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async cancelBooking(id, cancelDto: CancelBookingDto) {
    try {
      await this.findById(id);

      const updatedBooking = await this.databaseService.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELLED,
          cancel_reason: cancelDto.cancel_reason,
        },
        include: {
          room: true,
        },
      });

      return new Booking(updatedBooking as any);
    } catch (error) {
      console.error('BookingService -> cancelBooking -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
