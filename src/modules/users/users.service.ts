import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AccountIdentifier, BookingStatus, UserRole } from '@prisma/client';

import { DatabaseService } from '@/database/database.service';

import { User, UserDetail } from './models';
import {
  AdminUpdateUserDto,
  BlockOrUnblockUserDto,
  CreateUserDto,
  FilterUserDto,
  SortUserDto,
  UpdateUserDto,
} from './dtos';

import { CommonErrorMessagesEnum, RoleErrorMessagesEnum } from 'libs/common/enums';
import { hashPassword } from 'libs/common/utils/funcs';
import {
  createPaginatedResponse,
  getPaginationParams,
  PaginationParams,
} from 'libs/common/utils/pagination';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
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

  async create(createUserDto: CreateUserDto) {
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
      const field = createUserDto.email ? 'Email' : 'Phone';
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: CommonErrorMessagesEnum[`${field}Existed`],
          errors: { [field.toLowerCase()]: CommonErrorMessagesEnum[`${field}Existed`] },
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
      ...(filterOptions?.roles && { role: { in: filterOptions.roles } }),
      ...(filterOptions?.is_blocked && { is_blocked: filterOptions.is_blocked }),
      ...(filterOptions?.is_active && { is_active: filterOptions.is_active }),
      ...(filterOptions?.branchId && { branchId: filterOptions.branchId }),
      ...(filterOptions?.keyword && {
        OR: [
          {
            name: {
              contains: filterOptions.keyword,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: filterOptions.keyword,
              mode: 'insensitive',
            },
          },
          {
            phone: {
              contains: filterOptions.keyword,
              mode: 'insensitive',
            },
          },
        ],
      }),
    } as any;

    const orderBy = sortOptions?.reduce(
      (acc, { orderBy, order }) => ({
        ...acc,
        [orderBy]: order.toLowerCase(),
      }),
      {},
    );

    const [userObjects, total] = await this.databaseService.$transaction([
      this.databaseService.user.findMany({
        where,
        skip,
        take,
        orderBy,
        omit: {
          password: true,
        },
        include: {
          _count: {
            select: { bookings: true },
          },
          working_at: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
      this.databaseService.user.count({
        where,
      }),
    ]);

    return createPaginatedResponse(
      userObjects.map((user) => new User(user as any)),
      total,
      page,
      pageSize,
    );
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
    return this.databaseService.user.findFirst({
      where: {
        id,
      },
      omit: {
        password: true,
        deleted_identity: true,
        deleted_reason: true,
        branchId: true,
      },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });
  }

  async findByIdOrThrow(id: string) {
    const user = await this.findById(id);

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: CommonErrorMessagesEnum.UserNotFound,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return new User(user as any);
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

  async adminGetUserDetail(id: string) {
    await this.findByIdOrThrow(id);

    const user = await this.databaseService.user.findUnique({
      where: {
        id,
      },
      include: {
        bookings: true,
        working_at: true,
        blockHistory: true,
        blockedByMe: true,
        verification: true,
        reviews: true,
        preferences: true,
      },
    });

    return new UserDetail(user as any);
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

    const invalidSituation = [
      (user.role === UserRole.STAFF || user.role === UserRole.ADMIN) &&
        updateUserDto.role === UserRole.USER,
      user.role === UserRole.STAFF && !updateUserDto.branchId,
    ];

    if (invalidSituation.some((situation) => situation)) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: RoleErrorMessagesEnum.InvalidRoleChange,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const updatedUser = await this.databaseService.user.update({
      where: {
        id,
      },
      data: updateUserDto,
      omit: {
        password: true,
      },
      include: {
        working_at: true,
      },
    });

    return new User(updatedUser as any);
  }

  async;

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
    const deletedUser = await this.databaseService.user.update({
      where: { id },
      data: {
        is_active: false,
        deleted_at: new Date(),
        deleted_reason: reason,
        // Optionally anonymize sensitive data
        email: null,
        phone: null,
        deleted_identity:
          user.identifier_type === AccountIdentifier.EMAIL ? user.email : user.phone,
        name: `Deleted User ${id.slice(-6)}`,
      },
    });

    return new User(deletedUser as any);
  }

  async restore(id: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id },
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

      const restoredUSer = await this.databaseService.user.update({
        where: { id },
        data: {
          is_active: true,
          deleted_at: null,
          deleted_reason: null,
          deleted_identity: null,
          ...(user.identifier_type === AccountIdentifier.EMAIL
            ? { email: user.deleted_identity }
            : { phone: user.deleted_identity }),
        },
      });

      return new User(restoredUSer as any);
    } catch (error) {
      this.logger.error('UsersService -> restore -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async blockOrUnblockUser(id: string, blockedBy: string, dto: BlockOrUnblockUserDto) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id },
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

      await this.databaseService.userBlockHistory.create({
        data: {
          ...dto,
          userId: id,
          blockedBy,
        },
      });

      const updatedUser = await this.databaseService.user.update({
        where: { id },
        data: {
          is_blocked: !user.is_blocked,
          blocked_at: user.is_blocked ? null : new Date(),
          blocked_reason: dto.reason,
        },
        omit: {
          password: true,
        },
      });

      return new User(updatedUser as any);
    } catch (error) {
      this.logger.error('UsersService -> blockOrUnblockUser -> error', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  // Method to handle data retention policy
  //   async cleanupDeletedUsers(retentionPeriodMonths: number = 84) {
  //     // 7 years by default
  //     const cutoffDate = new Date();
  //     cutoffDate.setMonth(cutoffDate.getMonth() - retentionPeriodMonths);

  //     const deletedUsers = await this.databaseService.user.findMany({
  //       where: {
  //         deleted_at: {
  //           not: null,
  //           lt: cutoffDate,
  //         },
  //       },
  //     });

  //     for (const user of deletedUsers) {
  //       // Archive important data if needed
  //       await this.archiveUserData(user);

  //       await this.databaseService.user.delete({
  //         where: { id: user.id },
  //       });
  //     }
  //   }

  //   private async archiveUserData(user: User) {
  //     // Implement archiving logic (e.g., store in separate archive table or external storage)
  //     // This is important for audit trails and legal compliance
  //     // Just do a console log for now
  //     console.log(`Archiving user data for user: ${JSON.stringify(user)}`);
  //   }
}
