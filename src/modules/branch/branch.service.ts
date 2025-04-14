import {
  Injectable,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { BaseService } from '@/common/services/base.service';
import { CreateBranchDto } from './dtos/create-branch.dto';
import { UpdateBranchDto } from './dtos/update-branch.dto';
import { CommonErrorMessagesEnum } from 'libs/common';
import { Branch, BranchDetail, NearBy } from './models';
import { Image } from '@/modules/images/models';
import { FilterBranchesDto, SortBranchDto } from './dtos/query-branches.dto';

import {
  getPaginationParams,
  createPaginatedResponse,
  PaginationParams,
  createInfinityPaginationResponse,
} from 'libs/common/utils';

@Injectable()
export class BranchService extends BaseService {
  constructor(protected readonly databaseService: DatabaseService) {
    super(databaseService);
  }

  private formatImage(image: Image): Record<string, any> {
    return {
      url: image.url,
      publicId: image.publicId,
    };
  }

  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    try {
      const branchData = await this.databaseService.hotelBranch.create({
        data: {
          ...createBranchDto,
          thumbnail: this.formatImage(createBranchDto.thumbnail),
          images: createBranchDto.images.map((img) => this.formatImage(img)),
          translations: {
            create:
              createBranchDto.translations?.map((translation) => ({
                language: translation.language,
                name: translation.name,
                description: translation.description,
                address: translation.address,
                nearBy: translation.nearBy ? JSON.parse(JSON.stringify(translation.nearBy)) : [],
              })) || [],
          },
        },
        include: {
          translations: true,
        },
      });

      return new Branch(branchData);
    } catch (error) {
      console.error('Create branch error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async getLatestBranches(limit?: number) {
    try {
      const branches = await this.databaseService.hotelBranch.findMany({
        where: { is_active: true, isDeleted: false },
        take: limit ?? 3,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          province: {
            include: {
              translations: true,
            },
          },
          translations: true,
        },
      });

      return branches.map((branch) => new Branch(branch));
    } catch (error) {
      console.error('Get latest branches error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findMany(
    paginationOptions: PaginationParams,
    filterOptions?: FilterBranchesDto,
    sortOptions?: SortBranchDto[],
    includeDeleted = false,
  ) {
    try {
      const { skip, take, page, pageSize } = getPaginationParams(paginationOptions);

      const where = this.mergeWithBaseWhere(
        {
          ...(filterOptions?.is_active !== undefined ? { is_active: filterOptions.is_active } : {}),
          ...(filterOptions?.rating ? { rating: filterOptions.rating } : {}),
          ...(filterOptions?.provinceId ? { provinceId: filterOptions.provinceId } : {}),
          ...(filterOptions?.keyword
            ? {
                OR: [
                  { name: { contains: filterOptions.keyword, mode: 'insensitive' } },
                  { description: { contains: filterOptions.keyword, mode: 'insensitive' } },
                  { address: { contains: filterOptions.keyword, mode: 'insensitive' } },
                ],
              }
            : {}),
          ...(filterOptions?.amenities?.length
            ? {
                amenities: {
                  some: {
                    slug: {
                      in: filterOptions.amenities,
                    },
                  },
                },
              }
            : {}),
        },
        includeDeleted,
      );

      if (filterOptions?.provinceSlug) {
        where.province = {
          slug: filterOptions.provinceSlug,
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
            province: {
              include: {
                translations: true,
              },
            },
            // amenities: true,
            // rooms: {
            //   select: {
            //     id: true,
            //   },
            // },
            translations: true, // Include translations
          },
        }),
        this.databaseService.hotelBranch.count({ where }),
      ]);

      return createPaginatedResponse(
        branches.map((branch) => new Branch(branch)),
        total,
        page,
        pageSize,
      );
    } catch (error) {
      console.error('Find branches error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findByIdOrSlug(identifier: string, includeDeleted = false): Promise<Branch> {
    try {
      const branch = await this.databaseService.hotelBranch.findFirst({
        where: this.mergeWithBaseWhere(
          {
            OR: [{ id: identifier }, { slug: identifier }],
          },
          includeDeleted,
        ),
        include: {
          province: {
            include: {
              translations: true,
            },
          },
          amenities: true,
          rooms: {
            where: { isDeleted: false },
            include: {
              amenities: true,
              roomPriceHistories: true,
            },
          },
          translations: true, // Include translations
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

      return new BranchDetail(branch);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  private prepareUpdateData(updateBranchDto: UpdateBranchDto) {
    console.log('nearBy', updateBranchDto.nearBy);
    const updateData = {
      ...(updateBranchDto.thumbnail && {
        thumbnail: this.formatImage(updateBranchDto.thumbnail),
      }),
      ...(updateBranchDto.images && {
        images: updateBranchDto.images.map((img) => this.formatImage(img)),
      }),
      ...(updateBranchDto.amenityIds && {
        amenities: { set: updateBranchDto.amenityIds.map((id) => ({ id })) },
      }),
      ...(updateBranchDto.nearBy && {
        nearBy: updateBranchDto.nearBy,
      }),
      ...(updateBranchDto.provinceId && {
        province: { connect: { id: updateBranchDto.provinceId } },
      }),
      ...updateBranchDto,
    };

    delete updateData.amenityIds;
    delete updateData.provinceId;
    delete updateData.translations; // Remove translations from main update data

    return updateData as any;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    try {
      // Start transaction
      return await this.databaseService.$transaction(async (prisma) => {
        // 1. Check if branch exists
        const existingBranch = await prisma.hotelBranch.findUnique({
          where: { id },
          include: {
            amenities: true,
            translations: true,
          },
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
        const updateData = this.prepareUpdateData(updateBranchDto);

        // 3. Update branch
        let updatedBranch = await prisma.hotelBranch.update({
          where: { id },
          data: updateData,
          include: {
            province: {
              include: {
                translations: true,
              },
            },
            amenities: true,
            rooms: {
              where: { isDeleted: false },
            },
            translations: true, // Include translations
          },
        });

        // 4. Handle translations separately if provided
        if (updateBranchDto.translations?.length > 0) {
          const currentTranslations = existingBranch.translations || [];

          for (const translation of updateBranchDto.translations) {
            const existingTranslation = currentTranslations.find(
              (t) => t.language === translation.language,
            );

            if (existingTranslation) {
              await prisma.hotelBranchTranslation.update({
                where: { id: existingTranslation.id },
                data: {
                  name: translation.name,
                  description: translation.description,
                  address: translation.address,
                  nearBy: translation.nearBy ? JSON.parse(JSON.stringify(translation.nearBy)) : [],
                },
              });
            } else {
              await prisma.hotelBranchTranslation.create({
                data: {
                  hotelBranchId: id,
                  language: translation.language,
                  name: translation.name,
                  description: translation.description,
                  address: translation.address,
                  nearBy: translation.nearBy ? JSON.parse(JSON.stringify(translation.nearBy)) : [],
                },
              });
            }
          }

          // Fetch the updated branch with new translations
          updatedBranch = await prisma.hotelBranch.findUnique({
            where: { id },
            include: {
              province: {
                include: {
                  translations: true,
                },
              },
              amenities: true,
              rooms: {
                where: { isDeleted: false },
              },
              translations: true,
            },
          });
        }

        return new BranchDetail(updatedBranch);
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.softDelete('hotelBranch', id, async () => {
        const branch = await this.databaseService.hotelBranch.findUnique({
          where: { id },
          include: {
            rooms: {
              include: {
                flat_rooms: {
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
            },
          },
        });

        if (!branch) {
          throw new HttpException(
            { status: HttpStatus.NOT_FOUND, message: 'Branch not found' },
            HttpStatus.NOT_FOUND,
          );
        }

        const hasActiveBookings = branch.rooms.some((room) =>
          room.flat_rooms.some((fr) => fr.bookings.length > 0),
        );
        if (hasActiveBookings) {
          throw new HttpException(
            { status: HttpStatus.CONFLICT, message: 'Cannot delete branch with active bookings' },
            HttpStatus.CONFLICT,
          );
        }
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
  async restore(id: string): Promise<Branch> {
    try {
      const restoredBranch = await this.restoreDeleted('hotelBranch', id, {
        province: {
          include: {
            translations: true,
          },
        },
        amenities: true,
        translations: true,
      });

      return new Branch(restoredBranch);
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
  async findDeleted() {
    try {
      const branches = await this.databaseService.hotelBranch.findMany({
        where: { isDeleted: true },
        include: {
          amenities: true,
          rooms: true,
        },
      });

      return branches.map(
        (branch) =>
          new Branch({
            ...branch,
            thumbnail: branch.thumbnail as any,
            images: branch.images as any,
            // location: branch.location as { latitude: number; longitude: number },
          }),
      );
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }

  async findManyInfinite(
    page: number = 1,
    limit: number = 10,
    filterOptions?: FilterBranchesDto,
    sortOptions?: SortBranchDto[],
  ) {
    try {
      const skip = (page - 1) * limit;

      const where = this.mergeWithBaseWhere({
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
      });

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

      const items = await this.databaseService.hotelBranch.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          amenities: true,
          province: {
            include: {
              translations: true,
            },
          },
          translations: true,
        },
      });

      const branches = items.map((branch) => new Branch(branch));

      return createInfinityPaginationResponse(branches, { page, limit });
    } catch (error) {
      console.error('Find infinite branches error:', error);
      throw new InternalServerErrorException(CommonErrorMessagesEnum.RequestFailed);
    }
  }
}
