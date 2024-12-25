import { Branch } from '../models';
import { createInfinitePaginationDto, createPaginationDto } from '@/common/dtos';

export class BranchesPaginationResultDto extends createPaginationDto(Branch) {}

export class BranchesInfinitePaginationResultDto extends createInfinitePaginationDto(Branch) {}
