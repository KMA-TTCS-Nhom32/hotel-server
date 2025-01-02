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
import { RoomDetailService } from './room-detail.service';
import { CreateRoomDetailDto, UpdateRoomDetailDto } from './dtos/create-update-room-detail.dto';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '@/modules/auth/guards';
import { Roles } from '@/modules/auth/decorators';
import { RoomDetail } from './models';
import {
  FilterRoomDetailDto,
  QueryRoomDetailDto,
  RoomDetailPaginationResultDto,
  SortRoomDetailDto,
} from './dtos';

@ApiTags('Room Details')
@ApiExtraModels(QueryRoomDetailDto, FilterRoomDetailDto, SortRoomDetailDto)
@Controller('room-details')
export class RoomDetailController {
  constructor(private readonly roomDetailService: RoomDetailService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new room detail' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Room detail has been successfully created.',
    type: RoomDetail,
  })
  create(@Body() createRoomDetailDto: CreateRoomDetailDto): Promise<RoomDetail> {
    return this.roomDetailService.create(createRoomDetailDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all room details with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated room details list',
    type: RoomDetailPaginationResultDto,
  })
  findMany(@Query() query: QueryRoomDetailDto) {
    const { page, pageSize, filters, sort } = query;
    return this.roomDetailService.findMany({ page, pageSize }, filters, sort);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a room detail by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room detail found',
    type: RoomDetail,
  })
  findOne(@Param('id') id: string): Promise<RoomDetail> {
    return this.roomDetailService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a room detail' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room detail has been successfully updated.',
    type: RoomDetail,
  })
  update(
    @Param('id') id: string,
    @Body() updateRoomDetailDto: UpdateRoomDetailDto,
  ): Promise<RoomDetail> {
    return this.roomDetailService.update(id, updateRoomDetailDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a room detail' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Room detail has been successfully deleted.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.roomDetailService.remove(id);
  }
}
