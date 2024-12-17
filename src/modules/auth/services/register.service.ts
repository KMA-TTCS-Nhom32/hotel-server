import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AccountIdentifier } from '@prisma/client';

import { AuthErrorMessageEnum } from 'libs/common/enums';
import { EmailTypeEnum } from '@/communication/email/types';

import { DatabaseService } from '@/database/database.service';
import { UsersService } from '@/modules/users/users.service';
import { CreateUserDto } from '@/modules/users/dtos';
import { CommonService } from './common.service';

@Injectable()
export class RegisterService {
  constructor(
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
    private readonly databaseService: DatabaseService,
  ) {}

  async register(createUserDto: CreateUserDto, accountIdentifier: AccountIdentifier) {
    if (accountIdentifier === AccountIdentifier.PHONE && !createUserDto.phone) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: AuthErrorMessageEnum.PhoneIsRequired,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    if (accountIdentifier === AccountIdentifier.EMAIL && !createUserDto.email) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: AuthErrorMessageEnum.EmailIsRequired,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingUser = await this.usersService.findOne(
      createUserDto.email || createUserDto.phone,
      createUserDto.email ? 'email' : 'phone',
    );

    if (existingUser) {
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          message: AuthErrorMessageEnum.UserAlreadyExists,
        },
        HttpStatus.CONFLICT,
      );
    }

    // Use transaction to ensure data consistency
    return this.databaseService.$transaction(async (tx) => {
      // Create the user
      const user = await this.usersService.create(createUserDto);

      if (accountIdentifier === AccountIdentifier.EMAIL && user.email) {
        await this.commonService.sendVerificationCodeEmail(
          user.id,
          user.email,
          EmailTypeEnum.VERIFY_ACCOUNT,
        );
      }

      // Return the created user (excluding sensitive data)
      return {
        email: user.email ?? undefined,
        phone: user.phone ?? undefined,
        id: user.id,
        identifier_type: accountIdentifier,
      };
    });
  }
}
