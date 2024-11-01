import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { genSalt, hash } from 'bcrypt';

import { DatabaseService } from 'src/database/database.service';

import { User } from './models';

import { CreateUserDto } from './dtos';
import { AdminUpdateUserDto, UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existedUser = await this.databaseService.user.findFirst({
      where: {
        OR: [
          {
            email: createUserDto.email,
          },
          {
            phone: createUserDto.phone,
          },
        ],
      },
    });

    if (existedUser) {
      const errors =
        existedUser.email === createUserDto.email
          ? { email: 'emailExisted' }
          : { phone: 'phoneExisted' };

      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (createUserDto.role === UserRole.ADMIN || createUserDto.role === UserRole.USER) {
      const errors =
        createUserDto.role === UserRole.ADMIN
          ? { role: 'cannotBeAdmin' }
          : { role: 'cannotBeCustomer' };
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const clonedPayload = {
      verified_email: false,
      verified_phone: false,
      ...createUserDto,
    };

    const salt = await genSalt();
    clonedPayload.password = await hash(clonedPayload.password, salt);

    const createdUser = await this.databaseService.user.create({
      data: createUserDto,
      omit: {
        password: true,
      },
    });

    return createdUser;
  }

  async findMany(role?: UserRole) {
    if (role) {
      return this.databaseService.user.findMany({
        where: {
          role,
        },
      });
    }
    return this.databaseService.user.findMany();
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
          message: 'User not found',
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
          message: 'User not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    if (updateUserDto.role === UserRole.STAFF || updateUserDto.role === UserRole.USER) {
      const errors =
        updateUserDto.role === UserRole.STAFF
          ? { role: 'cannotBeStaff' }
          : { role: 'cannotBeCustomer' };
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
