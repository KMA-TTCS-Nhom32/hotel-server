import { User } from '../models';
import { createPaginationDto } from '@/common/dtos';

export class UsersPaginationResultDto extends createPaginationDto(User) {}
