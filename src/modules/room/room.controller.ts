import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiExtraModels, 
  ApiCreatedResponse, 
  ApiOkResponse, 
  ApiBadRequestResponse, 
  ApiUnauthorizedResponse, 
  ApiNotFoundResponse, 
  ApiConflictResponse, 
  ApiNoContentResponse 
} from '@nestjs/swagger';
import { RoomService } from './room.service';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '@/modules/auth/guards';
import { Public, Roles } from '@/modules/auth/decorators';
import { HotelRoom } from './models';
import {
  FilterHotelRoomDto,
  QueryHotelRoomDto,
  SortHotelRoomDto,
  HotelRoomPaginationResultDto,
  CreateHotelRoomDto,
  UpdateHotelRoomDto,
  ImmediateDeleteRoomsDto,
} from './dtos';
import { ResponseWithMessage } from '@/common/models';

@ApiTags('Rooms')
@ApiExtraModels(QueryHotelRoomDto, FilterHotelRoomDto, SortHotelRoomDto)
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new room' })
  @ApiCreatedResponse({
    description: 'Room has been successfully created.',
    type: HotelRoom,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  @ApiConflictResponse({
    description: 'Room with this slug already exists.',
  })
  create(@Body() createHotelRoomDto: CreateHotelRoomDto) {
    return this.roomService.create(createHotelRoomDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all rooms with pagination and filters' })
  @ApiOkResponse({
    description: 'Returns paginated rooms list',
    type: HotelRoomPaginationResultDto,
  })
  findMany(@Query() query: QueryHotelRoomDto) {
    const { page, pageSize, filters, sort } = query;
    return this.roomService.findManyPagination({ page, pageSize }, filters, sort);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Get('in-branch/:branchId')
  @ApiOperation({ summary: 'ADMIN - STAFF Get all rooms by branch ID' })
  @ApiOkResponse({
    description: 'Returns all rooms by branch ID',
    type: [HotelRoom],
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  findManyByBranchId(@Param('branchId') branchId: string) {
    return this.roomService.findManyByBranchId(branchId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a room by id' })
  @ApiOkResponse({
    description: 'Room found',
    type: HotelRoom,
  })
  @ApiNotFoundResponse({
    description: 'Room not found.',
  })
  findOne(@Param('id') id: string) {
    return this.roomService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a room' })
  @ApiOkResponse({
    description: 'Room has been successfully updated.',
    type: HotelRoom,
  })
  @ApiNotFoundResponse({
    description: 'Room not found.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  @ApiConflictResponse({
    description: 'Room with this slug already exists.',
  })
  update(@Param('id') id: string, @Body() updateHotelRoomDto: UpdateHotelRoomDto) {
    return this.roomService.update(id, updateHotelRoomDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete a room' })
  @ApiNoContentResponse({
    description: 'Room has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Room not found.',
  })
  @ApiConflictResponse({
    description: 'Cannot delete room with active bookings.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.roomService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted room' })
  @ApiOkResponse({
    description: 'Room restored successfully',
    type: ResponseWithMessage,
  })
  restore(@Param('id') id: string) {
    return this.roomService.restore(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'Get all soft-deleted rooms' })
  @ApiOkResponse({
    description: 'Returns all soft-deleted rooms',
    type: [HotelRoom],
  })
  findDeleted() {
    return this.roomService.findDeleted();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete('permanent-delete')
  @ApiOperation({ summary: 'ADMIN - Delete rooms permanently' })
  @ApiNoContentResponse({
    description: 'Rooms have been successfully deleted permanently.',
  })
  @ApiNotFoundResponse({
    description: 'Rooms not found.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  async permanentDelete(@Body() dto: ImmediateDeleteRoomsDto) {
    return this.roomService.immediateDelete(dto.ids);
  }
}
