import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Body,
  Param,
  Post,
  Req,
  Patch,
  Delete,
  HttpException,
} from '@nestjs/common';
import { 
  ApiOkResponse, 
  ApiExtraModels, 
  ApiOperation, 
  ApiTags,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { Request } from 'express';

import { UsersService } from './users.service';

import {
  CreateUserDto,
  DeleteUserDto,
  FilterUserDto,
  QueryUsersDto,
  SortUserDto,
  UsersPaginationResultDto,
  BlockOrUnblockUserDto,
  AdminUpdateUserDto,
} from './dtos';

import { DEFAULT_PAGESIZE } from 'libs/common/constants';
import { RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import { JwtUser } from '../auth/types';
import { User, UserDetail } from './models';

@ApiTags('Users')
@Controller('users')
@ApiExtraModels(QueryUsersDto, FilterUserDto, SortUserDto, CreateUserDto, DeleteUserDto)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('/')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Get users list successfully',
    type: UsersPaginationResultDto,
  })
  async getUsers(@Query() query: QueryUsersDto, @Req() req: Request) {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? DEFAULT_PAGESIZE;

    const user = req.user as JwtUser;

    return this.usersService.findMany({ page, pageSize }, query.filters, query.sort, user.userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('/block-action/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block or unblock a user' })
  @ApiOkResponse({
    description: 'User blocked/unblocked successfully',
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async blockUser(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: BlockOrUnblockUserDto,
  ) {
    const user = req.user as JwtUser;

    return this.usersService.blockOrUnblockUser(id, user.userId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get detailed user information (Admin only)' })
  @ApiOkResponse({
    description: 'User details retrieved successfully',
    type: UserDetail,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async adminGetUserDetail(@Param('id') id: string) {
    return this.usersService.adminGetUserDetail(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update user information (Admin only)' })
  @ApiOkResponse({
    description: 'User updated successfully',
    type: UserDetail,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Invalid role change request',
  })
  @ApiConflictResponse({
    description: 'Cannot change own role',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async adminUpdateUser(
    @Param('id') id: string,
    @Body() updateDto: AdminUpdateUserDto,
    @Req() req: Request,
  ) {
    const user = req.user as JwtUser;

    if (user.userId === id && updateDto.role) {
      throw new HttpException(
        {
          status: HttpStatus.CONFLICT,
          message: 'Cannot change own role',
        },
        HttpStatus.CONFLICT,
      );
    }

    return this.usersService.adminUpdate(id, updateDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a user (Admin only)' })
  @ApiOkResponse({
    description: 'User deleted successfully',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiConflictResponse({
    description: 'User has active bookings',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async deleteUser(@Param('id') id: string, @Body() deleteDto: DeleteUserDto) {
    return this.usersService.softDelete(id, deleteDto.reason);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('/:id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a deleted user (Admin only)' })
  @ApiOkResponse({
    description: 'User restored successfully',
    type: User,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async restoreUser(@Param('id') id: string) {
    return this.usersService.restore(id);
  }
}
