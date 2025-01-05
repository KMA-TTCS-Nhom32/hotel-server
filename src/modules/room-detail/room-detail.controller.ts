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
import { UserRole } from '@prisma/client';
import { RolesGuard } from '@/modules/auth/guards';
import { Public, Roles } from '@/modules/auth/decorators';
import { RoomDetail } from './models';
import {
    CreateRoomDetailDto,
  FilterRoomDetailDto,
  QueryRoomDetailDto,
  RoomDetailPaginationResultDto,
  SortRoomDetailDto,
  UpdateRoomDetailDto,
} from './dtos';
import { RoomDetailInfinitePaginationResultDto } from './dtos/room-detail-infinite-result.dto';

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
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  create(@Body() createRoomDetailDto: CreateRoomDetailDto): Promise<RoomDetail> {
    return this.roomDetailService.create(createRoomDetailDto);
  }

  @Public()
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

  @Public()
  @Get('infinite')
  @ApiOperation({ summary: 'Get all room details with infinite pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated room details list',
    type: RoomDetailInfinitePaginationResultDto,
  })
  findManyInfinite(@Query() query: QueryRoomDetailDto) {
    const { page, pageSize, filters, sort } = query;
    return this.roomDetailService.findManyInfinite(page, pageSize, filters, sort);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a room detail by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room detail found',
    type: RoomDetail,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room detail not found.',
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
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room detail not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
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
  @ApiOperation({ summary: 'Soft delete a room detail' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Room detail has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Room detail not found.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete room detail with active bookings.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.roomDetailService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted room detail' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Room detail restored successfully',
    type: RoomDetail,
  })
  async restore(@Param('id') id: string) {
    return this.roomDetailService.restore(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'Get all soft-deleted room details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all soft-deleted room details',
    type: [RoomDetail],
  })
  async findDeleted() {
    return this.roomDetailService.findDeleted();
  }
}
