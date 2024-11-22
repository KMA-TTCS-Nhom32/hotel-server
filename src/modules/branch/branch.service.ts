import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';
import { CommonErrorMessagesEnum } from 'libs/common';
import { Branch } from './models';
import { Image } from '@/modules/images/models';

@Injectable()
export class BranchService {
  constructor(private readonly databaseService: DatabaseService) {}

  private formatImage(image: Image): Record<string, any> {
    return {
      url: image.url,
      publicId: image.publicId,
    };
  }

  private formatLocation(location: {
    latitude: number;
    longitude: number;
  }): Record<string, number> {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  }

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    try {
      const branchData = await this.databaseService.hotelBranch.create({
        data: {
          name: createBranchDto.name,
          description: createBranchDto.description,
          phone: createBranchDto.phone,
          address: createBranchDto.address,
          location: this.formatLocation(createBranchDto.location),
          is_active: createBranchDto.is_active ?? true,
          rating: createBranchDto.rating ?? 0,
          thumbnail: this.formatImage(createBranchDto.thumbnail),
          images: createBranchDto.images.map((img) => this.formatImage(img)),
        },
      });

      return new Branch({
        ...branchData,
        thumbnail: branchData.thumbnail as unknown as Image,
        images: branchData.images as unknown as Image[],
        id: branchData.id,
        location: branchData.location as { latitude: number; longitude: number },
        createdAt: branchData.createdAt,
        updatedAt: branchData.updatedAt,
      });
    } catch (error) {
      console.error('Create branch error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  findAll() {
    return `This action returns all branch`;
  }

  findOne(id: number) {
    return `This action returns a #${id} branch`;
  }

  update(id: number, updateBranchDto: UpdateBranchDto) {
    return `This action updates a #${id} branch`;
  }

  remove(id: number) {
    return `This action removes a #${id} branch`;
  }
}
