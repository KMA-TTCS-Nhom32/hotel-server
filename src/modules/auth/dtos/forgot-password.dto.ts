import { IsEmail, IsString, MinLength, Length } from 'class-validator';

export class InitiateForgotPasswordEmailDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordWithOTPEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
