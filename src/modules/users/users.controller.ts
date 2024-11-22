import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiCreatedResponse } from '@nestjs/swagger';

import { UsersService } from './users.service';

import { CreateUserDto, QueryUsersDto, UpdateUserDto } from './dtos';

import { User } from './models';
import { DEFAULT_PAGESIZE } from 'libs/common/constants';
import { PaginatedResponse } from 'libs/common/utils/pagination';
import { UsersPaginationResultDto } from './dtos/users-pagination-result.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Get users list successfully',
    type: UsersPaginationResultDto,
  })
  async getUsers(@Query() query: QueryUsersDto): Promise<PaginatedResponse<User>> {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? DEFAULT_PAGESIZE;

    return this.usersService.findMany({ page, pageSize }, query.filters, query.sort);
  }

//   @Post('/')
//   @HttpCode(HttpStatus.CREATED)
//   @ApiCreatedResponse({
//     description: 'User created successfully',
//     type: User,
//   })
//   async createUser(@Body() createUserDto: Omit<CreateUserDto, 'role'>) {
//     return this.usersService.create(createUserDto);
//   }

  //   @Post('/update')
  //   @HttpCode(HttpStatus.OK)
  //   @ApiOkResponse({
  //     type: User,
  //   })
  //   async update(@Body() updateUserDto: UpdateUserDto) {
  //     return this.usersService.update(updateUserDto);
  //   }
}
