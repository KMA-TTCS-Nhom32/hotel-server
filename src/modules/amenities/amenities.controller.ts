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
import { 
  ApiTags, 
  ApiOperation, 
  ApiExtraModels, 
  ApiOkResponse, 
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
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
import { Amenity } from './models';

@ApiTags('amenities')
@ApiExtraModels(QueryAmenityDto, FilterAmenityDto, SortAmenityDto)
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get amenities' })
  @ApiOkResponse({
    description: 'Amenities found',
    type: AmenitiesPaginationResultDto,
  })
  async findMany(@Query() query: QueryAmenityDto) {
    const { page, pageSize, filters, sort } = query;

    return this.amenitiesService.findMany({ page, pageSize }, filters, sort);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get amenity by ID' })
  @ApiOkResponse({
    description: 'Amenity found',
    type: Amenity,
  })
  @ApiNotFoundResponse({
    description: 'Amenity not found',
  })
  async findOne(@Param('id') id: string) {
    return this.amenitiesService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create new amenity' })
  @ApiCreatedResponse({
    description: 'Amenity has been successfully created.',
    type: Amenity,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  async create(@Body() dto: CreateAmenityDto) {
    return this.amenitiesService.create(dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Update amenity' })
  @ApiOkResponse({
    description: 'Amenity has been successfully updated.',
    type: Amenity,
  })
  @ApiNotFoundResponse({
    description: 'Amenity not found.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateAmenityDto) {
    return this.amenitiesService.update(id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete amenity' })
  @ApiNoContentResponse({
    description: 'Amenity has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Amenity not found.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  async remove(@Param('id') id: string) {
    return this.amenitiesService.remove(id);
  }
}
