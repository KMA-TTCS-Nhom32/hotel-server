import { PaginationMetaResponse } from 'libs/common/utils';
import { User } from '../models';
import { createPaginationDto } from '@/common/dtos';

export class UsersPaginationResultDto extends createPaginationDto(User) {}
