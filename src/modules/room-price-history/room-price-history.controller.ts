import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Get,
} from '@nestjs/common';
import { RoomPriceHistoryService } from './room-price-history.service';
import { 
  ApiOperation, 
  ApiTags, 
  ApiCreatedResponse, 
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
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
  @ApiCreatedResponse({
    description: 'Room price history has been successfully created.',
    type: RoomPriceHistory,
  })
  @ApiBadRequestResponse({
    description: 'At least one price must be provided.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  create(@Body() createDto: CreateRoomPriceHistoryDto) {
    return this.roomPriceHistoryService.create(createDto);
  }

  @Get('room-detail/:roomDetailId')
  @ApiOperation({ summary: 'Get all price histories for a specific room detail' })
  @ApiOkResponse({
    description: 'Returns all price histories for the room detail',
    type: [RoomPriceHistory],
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  findManyByRoomDetail(@Param('roomDetailId') roomDetailId: string) {
    return this.roomPriceHistoryService.findMany(roomDetailId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a room price history' })
  @ApiOkResponse({
    description: 'Room price history has been successfully updated.',
    type: RoomPriceHistory,
  })
  @ApiNotFoundResponse({
    description: 'Room price history not found.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  update(@Param('id') id: string, @Body() updateDto: UpdateRoomPriceHistoryDto) {
    return this.roomPriceHistoryService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a room price history' })
  @ApiNoContentResponse({
    description: 'Room price history has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Room price history not found.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  remove(@Param('id') id: string) {
    return this.roomPriceHistoryService.remove(id);
  }
}
