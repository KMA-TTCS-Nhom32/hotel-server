import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User, UserRole } from '@prisma/client';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

import { SortCaseEnum } from 'libs/common/enums';

export class FilterUserDto {
  @ApiPropertyOptional({
    type: String,
    enum: UserRole,
    example: [UserRole.ADMIN, UserRole.STAFF],
  })
  @IsOptional()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[] | null;
}

export class SortUserDto {
  @ApiProperty({
    type: String,
    description: 'Key of User',
  })
  @Type(() => String)
  @IsString()
  orderBy: keyof User;

  @ApiProperty({
    type: String,
    description: 'Order of sorting',
    example: SortCaseEnum.Asc,
    enum: SortCaseEnum,
  })
  @IsString()
  @IsEnum(SortCaseEnum)
  order: string;
}

export class QueryUsersDto {
  @ApiPropertyOptional({
    type: Number,
  })
  @Transform(({ value }) => (value ? Number(value) : 1))
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    type: Number,
  })
  @Transform(({ value }) => (value ? Number(value) : 10))
  @IsNumber()
  @IsOptional()
  pageSize?: number;

  @ApiPropertyOptional({ type: String, description: `JSON string of ${FilterUserDto.name}` })
  @IsOptional()
  @Transform(({ value }) => (value ? plainToInstance(FilterUserDto, JSON.parse(value)) : undefined))
  @ValidateNested()
  @Type(() => FilterUserDto)
  filters?: FilterUserDto | null;

  @ApiPropertyOptional({ type: String, description: `JSON string of ${SortUserDto.name}[]` })
  @IsOptional()
  @Transform(({ value }) => {
    return value ? plainToInstance(SortUserDto, JSON.parse(value)) : undefined;
  })
  @ValidateNested({ each: true })
  @Type(() => SortUserDto)
  sort?: SortUserDto[] | null;
}
