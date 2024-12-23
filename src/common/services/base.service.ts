import { Injectable } from '@nestjs/common';
import { SoftDeleteService } from './soft-delete.service';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class BaseService extends SoftDeleteService {
  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService);
  }

  protected getBaseWhere(includeDeleted = false) {
    return includeDeleted ? {} : { isDeleted: false };
  }

  protected mergeWithBaseWhere(additionalWhere: any = {}, includeDeleted = false) {
    return {
      ...this.getBaseWhere(includeDeleted),
      ...additionalWhere,
    };
  }
}
