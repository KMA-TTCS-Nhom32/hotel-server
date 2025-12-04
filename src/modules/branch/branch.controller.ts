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
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiExtraModels,
  ApiHeader,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { Language } from '@prisma/client';
import { PreferredLanguage } from '@/common/decorators';
import { BranchService } from './branch.service';
import { BranchTranslationDto, CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';
import { Branch, BranchDetail, Location, NearBy } from './models';
import { RolesGuard } from '../auth/guards';
import { Public, Roles } from '../auth/decorators';
import { UserRole } from '@prisma/client';
import {
  FilterBranchesDto,
  QueryBranchesDto,
  SortBranchDto,
  BranchesPaginationResultDto,
  BranchesInfinitePaginationResultDto,
  GetLastestBranchesDto,
} from './dtos';

@ApiTags('Branches')
@ApiExtraModels(
  QueryBranchesDto,
  FilterBranchesDto,
  SortBranchDto,
  Location,
  NearBy,
  BranchTranslationDto,
)
@Controller('branches')
export class BranchController {
  private readonly logger = new Logger(BranchController.name);
  constructor(private readonly branchService: BranchService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiCreatedResponse({
    description: 'Branch has been successfully created.',
    type: Branch,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  create(@Body() createBranchDto: CreateBranchDto): Promise<Branch> {
    return this.branchService.create(createBranchDto);
  }

  @Public()
  @Get('latest')
  @ApiOperation({ summary: 'Get latest branches' })
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language preference (en, vi)',
    required: false,
  })
  @ApiOkResponse({
    description: 'Returns latest branches',
    type: [Branch],
  })
  getLatestBranches(
    @Query() getLastestBranchesDto: GetLastestBranchesDto,
    @PreferredLanguage() language: Language,
  ) {
    return this.branchService.getLatestBranches(getLastestBranchesDto.limit, language);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all branches with pagination and filters' })
  @ApiOkResponse({
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
  @ApiOkResponse({
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
  @ApiHeader({
    name: 'Accept-Language',
    description: 'Language preference (en, vi)',
    required: false,
  })
  @ApiOkResponse({
    description: 'Returns a branch',
    type: BranchDetail,
  })
  findOne(@Param('idOrSlug') idOrSlug: string, @PreferredLanguage() language: Language) {
    return this.branchService.findByIdOrSlug(idOrSlug, language);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a branch' })
  @ApiOkResponse({
    description: 'Branch has been successfully updated.',
    type: Branch,
  })
  @ApiNotFoundResponse({
    description: 'Branch not found.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  async update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    this.logger.log(
      `Updating branch with ID: ${id}`,
      `nearBy: ${JSON.stringify(updateBranchDto.nearBy)}`,
    );
    return this.branchService.update(id, updateBranchDto);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a branch' })
  @ApiNoContentResponse({
    description: 'Branch has been successfully deleted.',
  })
  @ApiNotFoundResponse({
    description: 'Branch not found.',
  })
  @ApiConflictResponse({
    description: 'Cannot delete branch with active bookings.',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized.',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.branchService.remove(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted branch' })
  @ApiOkResponse({ description: 'Branch restored successfully' })
  async restore(@Param('id') id: string) {
    return this.branchService.restore(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('deleted')
  @ApiOperation({ summary: 'Get all soft-deleted branches' })
  @ApiOkResponse({
    description: 'Returns all soft-deleted branches',
    type: [Branch],
  })
  async findDeleted() {
    return this.branchService.findDeleted();
  }
}
