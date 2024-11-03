import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiOkResponse } from '@nestjs/swagger';

import { UsersService } from './users.service';

import { CreateUserDto, UpdateUserDto } from './dtos';

import { User } from './models';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/')
  @HttpCode(HttpStatus.OK)
  // @ApiOkResponse({
  //     type: UserInfinityPaginationResult,
  // })
  async findMany(@Query('role') role?: UserRole) {
    return this.usersService.findMany(role);
  }

  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponse({
    type: User,
  })
  async create(@Body() createUserDto: Omit<CreateUserDto, 'role'>) {
    return this.usersService.create(createUserDto);
  }

  //   @Post('/update')
  //   @HttpCode(HttpStatus.OK)
  //   @ApiOkResponse({
  //     type: User,
  //   })
  //   async update(@Body() updateUserDto: UpdateUserDto) {
  //     return this.usersService.update(updateUserDto);
  //   }
}
