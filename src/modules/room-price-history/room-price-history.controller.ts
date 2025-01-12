import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Get,
  HttpStatus,
} from '@nestjs/common';
import { RoomPriceHistoryService } from './room-price-history.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateRoomPriceHistoryDto, UpdateRoomPriceHistoryDto } from './dtos';
import { RoomPriceHistory } from './models.ts';
import { RolesGuard } from '@/modules/auth/guards';
import { Roles } from '@/modules/auth/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Room Price Histories')
@Controller('room-price-histories')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN)
export class RoomPriceHistoryController {
  constructor(private readonly roomPriceHistoryService: RoomPriceHistoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new room price history' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Room price history has been successfully created.',
    type: RoomPriceHistory,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'At least one price must be provided.',
  })
  create(@Body() createDto: CreateRoomPriceHistoryDto) {
    return this.roomPriceHistoryService.create(createDto);
  }

  @Get('room-detail/:roomDetailId')
  @ApiOperation({ summary: 'Get all price histories for a specific room detail' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all price histories for the room detail',
    type: [RoomPriceHistory],
  })
  findManyByRoomDetail(@Param('roomDetailId') roomDetailId: string) {
    return this.roomPriceHistoryService.findMany(roomDetailId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a room price history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room price history has been successfully updated.',
    type: RoomPriceHistory,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room price history not found.',
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateRoomPriceHistoryDto) {
    return this.roomPriceHistoryService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a room price history' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Room price history has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room price history not found.',
  })
  remove(@Param('id') id: string) {
    return this.roomPriceHistoryService.remove(id);
  }
}
