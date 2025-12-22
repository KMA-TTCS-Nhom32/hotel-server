/**
 * This DTO is used to expose enums to Swagger and the generated SDK.
 * It is not used in any API endpoint, but registered via extraModels in main.ts.
 */
import { ApiProperty } from '@nestjs/swagger';
import {
  SortCaseEnum,
  CommonErrorMessagesEnum,
  RoleErrorMessagesEnum,
  AuthErrorMessageEnum,
  ImageErrorMessagesEnum,
  RoomErrorMessagesEnum,
  BookingErrorMessagesEnum,
} from '@libs/common/enums';

export class ExposedEnumsDto {
  @ApiProperty({ enum: SortCaseEnum, enumName: 'SortCaseEnum' })
  sortCase: SortCaseEnum;

  @ApiProperty({ enum: CommonErrorMessagesEnum, enumName: 'CommonErrorMessagesEnum' })
  commonErrorMessages: CommonErrorMessagesEnum;

  @ApiProperty({ enum: RoleErrorMessagesEnum, enumName: 'RoleErrorMessagesEnum' })
  roleErrorMessages: RoleErrorMessagesEnum;

  @ApiProperty({ enum: AuthErrorMessageEnum, enumName: 'AuthErrorMessageEnum' })
  authErrorMessage: AuthErrorMessageEnum;

  @ApiProperty({ enum: ImageErrorMessagesEnum, enumName: 'ImageErrorMessagesEnum' })
  imageErrorMessages: ImageErrorMessagesEnum;

  @ApiProperty({ enum: RoomErrorMessagesEnum, enumName: 'RoomErrorMessagesEnum' })
  roomErrorMessages: RoomErrorMessagesEnum;

  @ApiProperty({ enum: BookingErrorMessagesEnum, enumName: 'BookingErrorMessagesEnum' })
  bookingErrorMessages: BookingErrorMessagesEnum;
}
