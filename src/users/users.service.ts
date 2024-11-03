import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { DatabaseService } from '@/database/database.service';

import { User } from './models';
import { CreateUserDto } from './dtos';
import { AdminUpdateUserDto, UpdateUserDto } from './dtos/update-user.dto';

import { ErrorMessagesEnum } from 'libs/common/enums';
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
          message: ErrorMessagesEnum.EitherPhoneOrEmailIsRequired,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const existedUser = await this.isUserExisted(createUserDto.email, createUserDto.phone);

    if (existedUser) {
      const errors = createUserDto.email
        ? { email: ErrorMessagesEnum.EmailExisted }
        : { phone: ErrorMessagesEnum.PhoneExisted };

      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const clonedPayload = {
      ...createUserDto,
    };

    clonedPayload.password = await hashPassword(createUserDto.password);

    const createdUser = await this.databaseService.user.create({
      data: createUserDto,
      omit: {
        password: true,
      },
    });

    return createdUser;
  }

  async findMany(params: PaginationParams, role?: UserRole) {
    const { skip, take, page, pageSize } = getPaginationParams(params);

    const where = role ? { role } : {};

    const [users, total] = await this.databaseService.$transaction([
      this.databaseService.user.findMany({
        where,
        skip,
        take,
      }),
      this.databaseService.user.count({
        where,
      }),
    ]);

    return createPaginatedResponse(users, total, page, pageSize);
  }

  async findOne(uniqueField: string, type: 'email' | 'id' | 'phone'): Promise<User | null> {
    if (type === 'email') {
      return this.databaseService.user.findUnique({
        where: {
          email: uniqueField,
        },
      });
    }

    if (type === 'phone') {
      return this.databaseService.user.findUnique({
        where: {
          phone: uniqueField,
        },
      });
    }

    return this.databaseService.user.findUnique({
      where: {
        id: uniqueField,
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.databaseService.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          message: ErrorMessagesEnum.UserNotFound,
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
          message: ErrorMessagesEnum.UserNotFound,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (updateUserDto.role === UserRole.STAFF || updateUserDto.role === UserRole.USER) {
      const errors =
        updateUserDto.role === UserRole.STAFF
          ? { role: ErrorMessagesEnum.CannotBeStaff }
          : { role: ErrorMessagesEnum.CannotBeCustomer };
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors,
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
}
