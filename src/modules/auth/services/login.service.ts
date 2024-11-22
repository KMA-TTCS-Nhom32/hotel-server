import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { compare } from 'bcrypt';
import { UsersService } from '@/modules/users/users.service';
import { AuthErrorMessageEnum } from 'libs/common/enums';

@Injectable()
export class LoginService {
  constructor(private readonly usersService: UsersService) {}

  async validateLogin(emailOrPhone: string, password: string) {
    const fieldInput = this.getLoginFieldType(emailOrPhone);
    const user = await this.usersService.findOne(emailOrPhone, fieldInput);

    if (!user?.[fieldInput]) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: AuthErrorMessageEnum.WrongUsernameOrPassword,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

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

    // Check if user is verified based on login method
    if (fieldInput === 'email' && !user.verified_email) {
      throw new HttpException(
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          message: AuthErrorMessageEnum.EmailNotVerified,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (fieldInput === 'phone' && !user.verified_phone) {
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

  private getLoginFieldType(input: string): keyof Pick<User, 'email' | 'phone'> {
    return input.includes('@') ? 'email' : 'phone';
  }

  private async comparePassword(password: string, hashPassword: string) {
    return await compare(password, hashPassword);
  }
}
