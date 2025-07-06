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
  ApiOkResponse, 
  ApiCreatedResponse, 
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiConflictResponse
} from '@nestjs/swagger';
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
  @ApiCreatedResponse({
    description: 'Room detail has been successfully created.',
    type: RoomDetail,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  create(@Body() createRoomDetailDto: CreateRoomDetailDto): Promise<RoomDetail> {
    return this.roomDetailService.create(createRoomDetailDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all room details with pagination and filters' })
  @ApiOkResponse({
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
  @ApiOkResponse({
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
  @ApiOkResponse({
    description: 'Room detail found',
    type: RoomDetail,
  })
  @ApiNotFoundResponse({
    description: 'Room detail not found.',
  })
  findOne(@Param('id') id: string): Promise<RoomDetail> {
    return this.roomDetailService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a room detail' })
  @ApiOkResponse({
    description: 'Room detail has been successfully updated.',
    type: RoomDetail,
  })
  @ApiNotFoundResponse({
    description: 'Room detail not found.',
  })
  @ApiUnauthorizedResponse({
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
  @ApiNoContentResponse({
    description: 'Room detail has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Room detail not found.',
  })
  @ApiConflictResponse({
    description: 'Cannot delete room detail with active bookings.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.roomDetailService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted room detail' })
  @ApiOkResponse({
    description: 'Room detail restored successfully',
    type: RoomDetail,
  })
  @ApiNotFoundResponse({
    description: 'Room detail not found.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  async restore(@Param('id') id: string) {
    return this.roomDetailService.restore(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'Get all soft-deleted room details' })
  @ApiOkResponse({
    description: 'Returns all soft-deleted room details',
    type: [RoomDetail],
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  async findDeleted() {
    return this.roomDetailService.findDeleted();
  }
}
