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
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExtraModels } from '@nestjs/swagger';
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
} from './dtos';

@ApiTags('Rooms')
@ApiExtraModels(QueryHotelRoomDto, FilterHotelRoomDto, SortHotelRoomDto)
@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Room has been successfully created.',
    type: HotelRoom,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  create(@Body() createHotelRoomDto: CreateHotelRoomDto) {
    return this.roomService.create(createHotelRoomDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all rooms with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated rooms list',
    type: HotelRoomPaginationResultDto,
  })
  findMany(@Query() query: QueryHotelRoomDto) {
    const { page, pageSize, filters, sort } = query;
    return this.roomService.findManyPagination({ page, pageSize }, filters, sort);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a room by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room found',
    type: HotelRoom,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room not found.',
  })
  findOne(@Param('id') id: string) {
    return this.roomService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a room' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room has been successfully updated.',
    type: HotelRoom,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  update(@Param('id') id: string, @Body() updateHotelRoomDto: UpdateHotelRoomDto) {
    return this.roomService.update(id, updateHotelRoomDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Soft delete a room' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Room has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room not found.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete room with active bookings.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.roomService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted room' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room restored successfully',
    type: HotelRoom,
  })
  restore(@Param('id') id: string) {
    return this.roomService.restore(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'Get all soft-deleted rooms' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all soft-deleted rooms',
    type: [HotelRoom],
  })
  findDeleted() {
    return this.roomService.findDeleted();
  }
}
