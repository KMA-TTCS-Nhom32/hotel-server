import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiExtraModels } from '@nestjs/swagger';
import {
  AmenitiesPaginationResultDto,
  CreateAmenityDto,
  FilterAmenityDto,
  QueryAmenityDto,
  SortAmenityDto,
  UpdateAmenityDto,
} from './dtos';
import { AmenitiesService } from './amenities.service';
import { RolesGuard } from '@/modules/auth/guards';
import { Public, Roles } from '@/modules/auth/decorators';
import { UserRole } from '@prisma/client';
import { DEFAULT_PAGESIZE, PaginatedResponse } from 'libs/common';
import { Amenity } from './models';

@ApiTags('amenities')
@ApiExtraModels(FilterAmenityDto, SortAmenityDto)
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all amenities' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Amenities found',
    type: AmenitiesPaginationResultDto,
  })
  async findAll(@Query() query: QueryAmenityDto): Promise<PaginatedResponse<Amenity>> {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? DEFAULT_PAGESIZE;

    return this.amenitiesService.findMany({ page, pageSize }, query.filters, query.sort);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.amenitiesService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create new amenity' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Amenity has been successfully created.',
    type: Amenity,
  })
  async create(@Body() dto: CreateAmenityDto) {
    return this.amenitiesService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update amenity' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Amenity has been successfully updated.',
    type: Amenity,
  })
  async update(@Param('id') id: string, @Body() dto: UpdateAmenityDto) {
    return this.amenitiesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.amenitiesService.remove(id);
  }
}
