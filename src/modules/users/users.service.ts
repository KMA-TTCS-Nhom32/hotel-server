import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { BookingStatus, UserRole } from '@prisma/client';

import { DatabaseService } from '@/database/database.service';

import { User } from './models';
import { CreateUserDto, FilterUserDto, SortUserDto } from './dtos';
import { AdminUpdateUserDto, UpdateUserDto } from './dtos/update-user.dto';

import { CommonErrorMessagesEnum, RoleErrorMessagesEnum } from 'libs/common/enums';
import { hashPassword } from 'libs/common/utils/funcs';
import {
  createPaginatedResponse,
  getPaginationParams,
  PaginationParams,
} from 'libs/common/utils/pagination';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  isUserExisted = async (email: string, phone: string) => {
    if (!email && !phone) {
      return false;
    }

    const existedUser = await this.databaseService.user.findFirst({
      where: {
        OR: [
          {
            email,
          },
          {
            phone,
          },
        ],
      },
    });

    if (existedUser) {
      return true;
    }

    return false;
  };

  async create(createUserDto: CreateUserDto): Promise<User> {
    if (!createUserDto.phone && !createUserDto.email) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: CommonErrorMessagesEnum.EitherPhoneOrEmailIsRequired,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const existedUser = await this.isUserExisted(createUserDto.email, createUserDto.phone);

    if (existedUser) {
      const message = createUserDto.email
        ? CommonErrorMessagesEnum.EmailExisted
        : CommonErrorMessagesEnum.PhoneExisted;

      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message,
          errors: {
            [createUserDto.email ? 'email' : 'phone']: message,
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const clonedPayload = {
      ...createUserDto,
    };

    clonedPayload.password = await hashPassword(createUserDto.password);

    const createdUser = await this.databaseService.user.create({
      data: clonedPayload,
      omit: {
        password: true,
      },
    });

    return createdUser;
  }

  async findMany(
    paginationOptions: PaginationParams,
    filterOptions?: FilterUserDto,
    sortOptions?: SortUserDto[],
  ) {
    const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);

    const where = {
      ...(filterOptions?.roles ? { role: { in: filterOptions.roles } } : {}),
    };

    const orderBy = sortOptions?.reduce(
      (acc, { orderBy, order }) => ({
        ...acc,
        [orderBy]: order.toLowerCase(),
      }),
      {},
    );

    const [users, total] = await this.databaseService.$transaction([
      this.databaseService.user.findMany({
        where,
        skip,
        take,
        orderBy,
        omit: {
          password: true,
        },
      }),
      this.databaseService.user.count({
        where,
      }),
    ]);

    return createPaginatedResponse(users, total, page, pageSize);
  }

  async findOne(uniqueField: string, type: 'email' | 'phone') {
    if (type === 'email') {
      return this.databaseService.user.findUnique({
        where: {
          email: uniqueField,
        },
      });
    }

    return this.databaseService.user.findUnique({
      where: {
        phone: uniqueField,
      },
    });
  }

  async findById(id: string) {
    return this.databaseService.user.findUnique({
      where: {
        id,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (Object.keys(updateUserDto).length === 0) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: CommonErrorMessagesEnum.EmptyUpdatePayload,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const user = await this.databaseService.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: CommonErrorMessagesEnum.UserNotFound,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return this.databaseService.user.update({
      where: {
        id,
      },
      data: updateUserDto,
      omit: {
        password: true,
      },
    });
  }

  async adminUpdate(id: string, updateUserDto: AdminUpdateUserDto) {
    const user = await this.databaseService.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: CommonErrorMessagesEnum.UserNotFound,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (updateUserDto.role === UserRole.STAFF || updateUserDto.role === UserRole.USER) {
      const message =
        updateUserDto.role === UserRole.STAFF
          ? RoleErrorMessagesEnum.CannotBeStaff
          : RoleErrorMessagesEnum.CannotBeCustomer;

      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message,
          errors: {
            role: message,
          },
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return this.databaseService.user.update({
      where: {
        id,
      },
      data: updateUserDto,
      omit: {
        password: true,
      },
    });
  }

  async softDelete(id: string, reason?: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            status: {
              in: [BookingStatus.PENDING, BookingStatus.WAITING_FOR_CHECK_IN],
            },
          },
        },
      },
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: CommonErrorMessagesEnum.UserNotFound,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Check for active bookings
    if (user.bookings.length > 0) {
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          message: CommonErrorMessagesEnum.UserHasActiveBookings,
        },
        HttpStatus.CONFLICT,
      );
    }

    // Perform soft delete
    return this.databaseService.user.update({
      where: { id },
      data: {
        is_active: false,
        deleted_at: new Date(),
        deleted_reason: reason,
        // Optionally anonymize sensitive data
        email: null,
        phone: null,
        name: `Deleted User ${id.slice(-6)}`,
      },
    });
  }

  // Method to handle data retention policy
  async cleanupDeletedUsers(retentionPeriodMonths: number = 84) {
    // 7 years by default
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - retentionPeriodMonths);

    const deletedUsers = await this.databaseService.user.findMany({
      where: {
        deleted_at: {
          not: null,
          lt: cutoffDate,
        },
      },
    });

    for (const user of deletedUsers) {
      // Archive important data if needed
      await this.archiveUserData(user);

      await this.databaseService.user.delete({
        where: { id: user.id },
      });
    }
  }

  private async archiveUserData(user: User) {
    // Implement archiving logic (e.g., store in separate archive table or external storage)
    // This is important for audit trails and legal compliance
    // Just do a console log for now
    console.log(`Archiving user data for user: ${JSON.stringify(user)}`);
  }
}
