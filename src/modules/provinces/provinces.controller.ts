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
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProvincesService } from './provinces.service';
import { CreateProvinceDto, UpdateProvinceDto } from './dtos/create-update-province.dto';
import { Province } from './models';
import { RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import { QueryProvincesDto } from './dtos/query-provinces.dto';
import { ProvincePaginationResultDto } from './dtos';

@ApiTags('Provinces')
@Controller('provinces')
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new province' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Province has been successfully created.',
    type: Province,
  })
  create(@Body() createProvinceDto: CreateProvinceDto): Promise<Province> {
    return this.provincesService.create(createProvinceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all provinces with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated provinces list',
    type: ProvincePaginationResultDto,
  })
  findMany(@Query() query: QueryProvincesDto) {
    const { page, pageSize, filters, sort } = query;
    return this.provincesService.findMany(
      { page, pageSize },
      filters,
      sort,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get province by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a province',
    type: Province,
  })
  findOne(@Param('id') id: string): Promise<Province> {
    return this.provincesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a province' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Province has been successfully updated.',
    type: Province,
  })
  update(
    @Param('id') id: string, 
    @Body() updateProvinceDto: UpdateProvinceDto
  ): Promise<Province> {
    return this.provincesService.update(id, updateProvinceDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a province' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Province has been successfully deleted.',
  })
  remove(@Param('id') id: string): Promise<void> {
    return this.provincesService.remove(id);
  }
}
