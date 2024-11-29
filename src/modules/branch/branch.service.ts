import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';
import { CommonErrorMessagesEnum } from 'libs/common';
import { Branch } from './models';
import { Image } from '@/modules/images/models';
import { FilterBranchesDto } from './dtos/query-branches.dto';
import { SortDto } from '@/common/dtos/filters-with-pagination.dto';
import { getPaginationParams, createPaginatedResponse, PaginationParams } from 'libs/common/utils';

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

  async findMany(
    paginationOptions: PaginationParams,
    filterOptions?: FilterBranchesDto,
    sortOptions?: SortDto<'name' | 'rating' | 'createdAt'>[],
  ) {
    try {
      const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);

      // Build where conditions
      const where: any = {
        ...(filterOptions?.is_active !== undefined ? { is_active: filterOptions.is_active } : {}),
        ...(filterOptions?.rating ? { rating: filterOptions.rating } : {}),
        ...(filterOptions?.keyword
          ? {
              OR: [
                { name: { contains: filterOptions.keyword, mode: 'insensitive' } },
                { description: { contains: filterOptions.keyword, mode: 'insensitive' } },
                { address: { contains: filterOptions.keyword, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      // Add amenities filter if provided
      if (filterOptions?.amenities?.length) {
        where.amenities = {
          some: {
            slug: {
              in: filterOptions.amenities,
            },
          },
        };
      }

      // Build sort conditions
      const orderBy = sortOptions?.reduce(
        (acc, { orderBy: field, order }) => ({
          ...acc,
          [field]: order.toLowerCase(),
        }),
        {},
      );

      const [branches, total] = await this.databaseService.$transaction([
        this.databaseService.hotelBranch.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            amenities: true,
            rooms: {
              select: {
                id: true,
              },
            },
          },
        }),
        this.databaseService.hotelBranch.count({ where }),
      ]);

      return createPaginatedResponse(
        branches.map(
          (branch) =>
            new Branch({
              ...branch,
              thumbnail: branch.thumbnail as unknown as Image,
              images: branch.images as unknown as Image[],
              location: branch.location as { latitude: number; longitude: number },
            }),
        ),
        total,
        page,
        pageSize,
      );
    } catch (error) {
      console.error('Find branches error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findById(id: string): Promise<Branch> {
    try {
      const branch = await this.databaseService.hotelBranch.findUnique({
        where: { id },
        include: {
          amenities: true,
          rooms: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
      });

      if (!branch) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            message: 'Branch not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      return new Branch({
        ...branch,
        thumbnail: branch.thumbnail as unknown as Image,
        images: branch.images as unknown as Image[],
        location: branch.location as { latitude: number; longitude: number },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    try {
      // Start transaction
      return await this.databaseService.$transaction(async (prisma) => {
        // 1. Check if branch exists
        const existingBranch = await prisma.hotelBranch.findUnique({
          where: { id },
          include: { amenities: true },
        });

        if (!existingBranch) {
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              message: 'Branch not found',
            },
            HttpStatus.NOT_FOUND,
          );
        }

        // 2. Prepare update data
        const updateData: any = {
          ...updateBranchDto,
          ...(updateBranchDto.location && {
            location: this.formatLocation(updateBranchDto.location),
          }),
          ...(updateBranchDto.thumbnail && {
            thumbnail: this.formatImage(updateBranchDto.thumbnail),
          }),
          ...(updateBranchDto.images && {
            images: updateBranchDto.images.map((img) => this.formatImage(img)),
          }),
        };

        // 3. Update branch
        const updatedBranch = await prisma.hotelBranch.update({
          where: { id },
          data: updateData,
          include: {
            amenities: true,
            rooms: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        });

        return new Branch({
          ...updatedBranch,
          thumbnail: updatedBranch.thumbnail as unknown as Image,
          images: updatedBranch.images as unknown as Image[],
          location: updatedBranch.location as { latitude: number; longitude: number },
        });
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Start transaction
      await this.databaseService.$transaction(async (prisma) => {
        // 1. Check if branch exists and has active bookings
        const branch = await prisma.hotelBranch.findUnique({
          where: { id },
          include: {
            rooms: {
              include: {
                bookings: {
                  where: {
                    status: {
                      in: ['PENDING', 'WAITING_FOR_CHECK_IN', 'CHECKED_IN'],
                    },
                  },
                },
              },
            },
          },
        });

        if (!branch) {
          throw new HttpException(
            {
              status: HttpStatus.NOT_FOUND,
              message: 'Branch not found',
            },
            HttpStatus.NOT_FOUND,
          );
        }

        // 2. Check for active bookings
        const hasActiveBookings = branch.rooms.some((room) => room.bookings.length > 0);
        if (hasActiveBookings) {
          throw new HttpException(
            {
              status: HttpStatus.CONFLICT,
              message: 'Cannot delete branch with active bookings',
            },
            HttpStatus.CONFLICT,
          );
        }

        // 3. Delete related records first (maintaining referential integrity)
        await prisma.hotelRoom.deleteMany({
          where: { branchId: id },
        });

        // 4. Delete the branch
        await prisma.hotelBranch.delete({
          where: { id },
        });
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
