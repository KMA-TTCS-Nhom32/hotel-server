import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BranchService } from './branch.service';
import { CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';
import { RolesGuard } from '../auth/guards';
import { Roles } from '../auth/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Branches')
@Controller('branch')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({
    status: 201,
    description: 'The branch has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchService.create(createBranchDto);
  }

  @Get()
  findAll() {
    return this.branchService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.branchService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchService.update(+id, updateBranchDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.branchService.remove(+id);
  }
}
