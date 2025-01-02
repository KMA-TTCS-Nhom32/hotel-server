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
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';
import { Branch, BranchDetail } from './models';
import { RolesGuard } from '../auth/guards';
import { Public, Roles } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import {
  FilterBranchesDto,
  QueryBranchesDto,
  SortBranchDto,
  BranchesPaginationResultDto,
  BranchesInfinitePaginationResultDto,
} from './dtos';

@ApiTags('Branches')
@ApiExtraModels(QueryBranchesDto, FilterBranchesDto, SortBranchDto)
@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Branch has been successfully created.',
    type: Branch,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  create(@Body() createBranchDto: CreateBranchDto): Promise<Branch> {
    return this.branchService.create(createBranchDto);
  }

  @Public()
  @Get('latest')
  @ApiOperation({ summary: 'Get latest branches' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns latest branches',
    type: [Branch],
  })
  getLatestBranches(@Body() limit?: number) {
    return this.branchService.getLatestBranches(limit);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all branches with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated branches list',
    type: BranchesPaginationResultDto,
  })
  async findMany(@Query() query: QueryBranchesDto) {
    const { page, pageSize, filters, sort } = query;
    return this.branchService.findMany({ page, pageSize }, filters, sort);
  }

  @Public()
  @Get('infinite')
  @ApiOperation({ summary: 'Get branches with infinite scroll for client app' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns branches with infinite pagination',
    type: BranchesInfinitePaginationResultDto,
  })
  async findManyInfinite(@Query() query: QueryBranchesDto) {
    const { page, pageSize: limit, filters, sort } = query;
    return this.branchService.findManyInfinite(page, limit, filters, sort);
  }

  @Public()
  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get branch by ID or slug' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a branch',
    type: BranchDetail,
  })
  findOne(@Param('idOrSlug') idOrSlug: string) {
    return this.branchService.findByIdOrSlug(idOrSlug);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a branch' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch has been successfully updated.',
    type: Branch,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  async update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchService.update(id, updateBranchDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Branch has been successfully deleted.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete branch with active bookings.',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.branchService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted branch' })
  @ApiResponse({ status: 200, description: 'Branch restored successfully' })
  async restore(@Param('id') id: string) {
    return this.branchService.restore(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'Get all soft-deleted branches' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all soft-deleted branches',
    type: [Branch],
  })
  async findDeleted() {
    return this.branchService.findDeleted();
  }
}
