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
import { RoomPromotionService } from './room-promotion.service';
import {
  CreateRoomPromotionDto,
  UpdateRoomPromotionDto,
} from './dtos/create-update-room-promotion.dto';
import { RoomPromotion } from './models';
import { RolesGuard } from '../auth/guards';
import { Public, Roles } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import {
  FilterRoomPromotionDto,
  QueryRoomPromotionDto,
  SortRoomPromotionDto,
} from './dtos/query-room-promotion.dto';
import { RoomPromotionPaginationResultDto } from './dtos';

@ApiTags('Room Promotions')
@ApiExtraModels(QueryRoomPromotionDto, FilterRoomPromotionDto, SortRoomPromotionDto)
@Controller('room-promotions')
export class RoomPromotionController {
  constructor(private readonly roomPromotionService: RoomPromotionService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new room promotion' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Room promotion has been successfully created.',
    type: RoomPromotion,
  })
  create(@Body() createRoomPromotionDto: CreateRoomPromotionDto): Promise<RoomPromotion> {
    return this.roomPromotionService.create(createRoomPromotionDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all room promotions with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated room promotions list',
    type: RoomPromotionPaginationResultDto,
  })
  findMany(@Query() query: QueryRoomPromotionDto) {
    const { page, pageSize, filters, sort } = query;
    return this.roomPromotionService.findMany({ page, pageSize }, filters, sort[0]);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get room promotion by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a room promotion',
    type: RoomPromotion,
  })
  findOne(@Param('id') id: string): Promise<RoomPromotion> {
    return this.roomPromotionService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a room promotion' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room promotion has been successfully updated.',
    type: RoomPromotion,
  })
  update(
    @Param('id') id: string,
    @Body() updateRoomPromotionDto: UpdateRoomPromotionDto,
  ): Promise<RoomPromotion> {
    return this.roomPromotionService.update(id, updateRoomPromotionDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a room promotion' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Room promotion has been successfully deleted.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.roomPromotionService.remove(id);
  }

  @Post(':id/restore')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore a soft-deleted room promotion' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room promotion restored successfully',
    type: RoomPromotion,
  })
  async restore(@Param('id') id: string) {
    return this.roomPromotionService.restore(id);
  }

  @Get('deleted')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all soft-deleted room promotions' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all soft-deleted room promotions',
    type: [RoomPromotion],
  })
  async findDeleted() {
    return this.roomPromotionService.findDeleted();
  }

  @Public()
  @Get('validate/:code/room/:roomDetailId')
  @ApiOperation({ summary: 'Validate a promotion code for a specific room' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the validated promotion details',
    type: RoomPromotion,
  })
  async validatePromotionCode(
    @Param('code') code: string,
    @Param('roomDetailId') roomDetailId: string,
  ) {
    return this.roomPromotionService.validatePromotionCode(code, roomDetailId);
  }
}
