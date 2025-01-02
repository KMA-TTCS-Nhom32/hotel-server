import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { AbstractModel } from 'libs/common';

@Injectable()
export class SoftDeleteService {
  constructor(private readonly db: DatabaseService) {}

  private getPrismaModel(modelName: string) {
    // Convert PascalCase to camelCase (e.g., HotelRoom -> hotelRoom)
    const camelCaseModel = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    
    // Check if the model exists in Prisma client
    if (!(camelCaseModel in this.db)) {
      throw new Error(`Model ${modelName} not found in Prisma client`);
    }

    return this.db[camelCaseModel];
  }

  protected async softDelete(
    model: string,
    id: string,
    additionalChecks?: () => Promise<void>,
  ): Promise<void> {
    const prismaModel = this.getPrismaModel(model);

    await this.db.$transaction(async (prisma) => {
      if (additionalChecks) {
        await additionalChecks();
      }

      await prismaModel.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    });
  }

  protected async restoreDeleted<T extends AbstractModel>(model: string, id: string): Promise<T> {
    const prismaModel = this.getPrismaModel(model);

    return await prismaModel.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
  }
}
