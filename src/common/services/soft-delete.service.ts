import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { AbstractModel } from 'libs/common';

@Injectable()
export class SoftDeleteService {
  constructor(private readonly db: DatabaseService) {}

  protected async softDelete(
    model: string,
    id: string,
    additionalChecks?: () => Promise<void>,
  ): Promise<void> {
    const prismaModel = this.db[model.toLowerCase()];

    if (!prismaModel) {
      throw new Error(`Model ${model} not found`);
    }

    await this.db.$transaction(async (prisma) => {
      // Run any additional checks if provided
      if (additionalChecks) {
        await additionalChecks();
      }

      await prisma[model.toLowerCase()].update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    });
  }

  protected async restoreDeleted<T extends AbstractModel>(model: string, id: string): Promise<T> {
    const prismaModel = this.db[model.toLowerCase()];

    if (!prismaModel) {
      throw new Error(`Model ${model} not found`);
    }

    return await prismaModel.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
  }
}
