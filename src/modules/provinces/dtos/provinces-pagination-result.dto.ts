import { createPaginationDto } from '@/common/dtos';
import { Province } from '../models';

export class ProvincePaginationResultDto extends createPaginationDto(Province) {}
