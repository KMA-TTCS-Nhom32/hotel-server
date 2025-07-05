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
import { 
  ApiTags, 
  ApiOperation, 
  ApiExtraModels,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';
import { ProvincesService } from './provinces.service';
import { CreateProvinceDto, UpdateProvinceDto } from './dtos/create-update-province.dto';
import { Province } from './models';
import { RolesGuard } from '../auth/guards';
import { Public, Roles } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import { FilterProvincesDto, QueryProvincesDto, SortProvinceDto } from './dtos/query-provinces.dto';
import { ProvincePaginationResultDto } from './dtos';

@ApiTags('Provinces')
@ApiExtraModels(QueryProvincesDto, FilterProvincesDto, SortProvinceDto)
@Controller('provinces')
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new province' })
  @ApiCreatedResponse({
    description: 'Province has been successfully created.',
    type: Province,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  create(@Body() createProvinceDto: CreateProvinceDto): Promise<Province> {
    return this.provincesService.create(createProvinceDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all provinces with pagination and filters' })
  @ApiOkResponse({
    description: 'Returns paginated provinces list',
    type: ProvincePaginationResultDto,
  })
  findMany(@Query() query: QueryProvincesDto) {
    const { page, pageSize, filters, sort } = query;
    return this.provincesService.findMany({ page, pageSize }, filters, sort);
  }

  @Get('deleted')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all soft-deleted provinces' })
  @ApiOkResponse({
    description: 'Returns all soft-deleted provinces',
    type: [Province],
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async findDeleted() {
    return this.provincesService.findDeleted();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get province by ID' })
  @ApiOkResponse({
    description: 'Returns a province',
    type: Province,
  })
  @ApiNotFoundResponse({
    description: 'Province not found',
  })
  findOne(@Param('id') id: string): Promise<Province> {
    return this.provincesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a province' })
  @ApiOkResponse({
    description: 'Province has been successfully updated.',
    type: Province,
  })
  @ApiNotFoundResponse({
    description: 'Province not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  update(@Param('id') id: string, @Body() updateProvinceDto: UpdateProvinceDto): Promise<Province> {
    return this.provincesService.update(id, updateProvinceDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a province' })
  @ApiNoContentResponse({
    description: 'Province has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Province not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.provincesService.remove(id);
  }

  @Post(':id/restore')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Restore a soft-deleted province' })
  @ApiOkResponse({ 
    description: 'Province restored successfully',
    type: Province
  })
  @ApiNotFoundResponse({
    description: 'Province not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async restore(@Param('id') id: string) {
    return this.provincesService.restore(id);
  }
}
