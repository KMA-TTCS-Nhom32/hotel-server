import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';
import { CreateAmenityDto, QueryAmenityDto, UpdateAmenityDto } from './dtos';
import { AmenitiesService } from './amenities.service';
import { RolesGuard } from '@/modules/auth/guards';
import { Public, Roles } from '@/modules/auth/decorators';
import { UserRole } from '@prisma/client';
import { DEFAULT_PAGESIZE, PaginatedResponse } from 'libs/common';
import { Amenity } from './models';

import { type Express } from "express";

@ApiTags('amenities')
@Controller('amenities')
@UseGuards(RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF) // Default role for all endpoints
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Public() // Override the default role requirement
  @Get()
  async findAll(@Query() query: QueryAmenityDto): Promise<PaginatedResponse<Amenity>> {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? DEFAULT_PAGESIZE;

    return this.amenitiesService.findMany({ page, pageSize }, query.filters, query.sort);
  }

  @Public() // Override the default role requirement
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.amenitiesService.findOne(id);
  }

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('icon'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        slug: { type: 'string' },
        type: { type: 'string', enum: ['ROOM', 'PROPERTY', 'SERVICE'] },
        icon: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async create(@Body() dto: CreateAmenityDto, @UploadedFile() icon?: Express.Multer.File) {
    return this.amenitiesService.create(dto, icon);
  }

  @Put(':id')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('icon'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAmenityDto,
    @UploadedFile() icon?: Express.Multer.File,
  ) {
    return this.amenitiesService.update(id, dto, icon);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.amenitiesService.remove(id);
  }
}
