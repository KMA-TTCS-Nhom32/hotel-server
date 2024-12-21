import { Branch } from '../models';
import { createPaginationDto } from '@/common/dtos';

export class BranchesPaginationResultDto extends createPaginationDto(Branch) {}
