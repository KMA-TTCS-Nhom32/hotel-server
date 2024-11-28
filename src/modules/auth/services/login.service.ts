import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { compare } from 'bcrypt';

import { UsersService } from '@/modules/users/users.service';
import { AuthErrorMessageEnum, CommonErrorMessagesEnum } from 'libs/common/enums';
import { EmailTypeEnum } from '@/communication/email/types';
import { CommonService } from './common.service';

@Injectable()
export class LoginService {
  constructor(
    private readonly usersService: UsersService,
    private readonly commonService: CommonService,
  ) {}

  getLoginFieldType(input: string): keyof Pick<User, 'email' | 'phone'> {
    return input.includes('@') ? 'email' : 'phone';
  }

  private async comparePassword(password: string, hashPassword: string) {
    return await compare(password, hashPassword);
  }

  async findUserOrThrow(emailOrPhone: string, type: 'email' | 'phone') {
    const user = await this.usersService.findOne(emailOrPhone, type);

    if (!user) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: CommonErrorMessagesEnum.UserNotFound,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    return user;
  }

  async validateLogin(emailOrPhone: string, password: string) {
    const fieldInput = this.getLoginFieldType(emailOrPhone);
    const user = await this.findUserOrThrow(emailOrPhone, fieldInput);

    const isPasswordMatched = await this.comparePassword(password, user.password);

    if (!isPasswordMatched) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: AuthErrorMessageEnum.WrongUsernameOrPassword,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const notVerifiedEmail = fieldInput === 'email' && !user.verified_email;
    const notVerifiedPhone = fieldInput === 'phone' && !user.verified_phone;

    // Check if user is verified based on login method
    if (notVerifiedEmail || notVerifiedPhone) {
      if (notVerifiedEmail) {
        await this.commonService.sendVerificationCodeEmail(
          user.id,
          user.email,
          EmailTypeEnum.VERIFY_ACCOUNT,
        );

        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            message: AuthErrorMessageEnum.EmailNotVerified,
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: AuthErrorMessageEnum.PhoneNotVerified,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const { password: _, ...result } = user;
    return result;
  }
}
