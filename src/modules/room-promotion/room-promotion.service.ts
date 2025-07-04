import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';
import { Prisma } from '@prisma/client';
import {
  CreateRoomPromotionDto,
  UpdateRoomPromotionDto,
} from './dtos/create-update-room-promotion.dto';
import { RoomPromotion } from './models';
import { FilterRoomPromotionDto, SortRoomPromotionDto } from './dtos/query-room-promotion.dto';

@Injectable()
export class RoomPromotionService {
  constructor(private readonly prisma: DatabaseService) {}

  async create(createRoomPromotionDto: CreateRoomPromotionDto): Promise<RoomPromotion> {
    const { translations, applied_room_ids, ...data } = createRoomPromotionDto;

    return await this.prisma.$transaction(async (tx) => {
      // Check if rooms exist
      if (applied_room_ids?.length > 0) {
        const rooms = await tx.roomDetail.findMany({
          where: {
            id: { in: applied_room_ids },
          },
          select: { id: true },
        });

        if (rooms.length !== applied_room_ids.length) {
          throw new NotFoundException('One or more room details not found');
        }
      }

      const roomPromotion = await tx.roomPromotion.create({
        data: {
          ...data,
          translations: translations?.length
            ? {
                create: translations.map((t) => ({
                  language: t.language,
                  description: t.description,
                })),
              }
            : undefined,
          rooms: {
            connect: applied_room_ids?.map((id) => ({ id })),
          },
        },
        include: {
          translations: true,
        },
      });

      return new RoomPromotion(roomPromotion);
    });
  }

  async findMany(
    pagination: { page?: number; pageSize?: number },
    filters?: FilterRoomPromotionDto,
    sort?: SortRoomPromotionDto,
  ) {
    const { page = 1, pageSize = 10 } = pagination;
    const skip = (page - 1) * pageSize;

    const where: Prisma.RoomPromotionWhereInput = {
      isDeleted: false,
    };

    // Apply filters
    if (filters) {
      if (filters.code) {
        where.code = { contains: filters.code, mode: 'insensitive' };
      }

      if (filters.roomDetailId) {
        where.rooms = {
          some: { id: filters.roomDetailId },
        };
      }

      if (filters.applied_type) {
        where.applied_type = filters.applied_type;
      }

      if (filters.discount_type) {
        where.discount_type = filters.discount_type;
      }

      if (filters.isActive !== undefined) {
        const now = new Date();
        if (filters.isActive) {
          where.start_date = { lte: now };
          where.end_date = { gte: now };
        } else {
          where.OR = [{ start_date: { gt: now } }, { end_date: { lt: now } }];
        }
      }
    }

    // Apply sorting - handle single sort object instead of array
    const orderBy: Prisma.RoomPromotionOrderByWithRelationInput = {};

    if (sort) {
      const field = sort.orderBy as string;
      const direction = sort.order.toLowerCase() as Prisma.SortOrder;
      orderBy[field] = direction;
    } else {
      // Default sorting if none provided
      orderBy.createdAt = 'desc';
    }

    const [promotions, total] = await Promise.all([
      this.prisma.roomPromotion.findMany({
        where,
        include: {
          translations: true,
        },
        skip,
        take: pageSize,
        orderBy,
      }),
      this.prisma.roomPromotion.count({ where }),
    ]);

    return {
      data: promotions.map((promotion) => new RoomPromotion(promotion)),
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findById(id: string): Promise<RoomPromotion> {
    const promotion = await this.prisma.roomPromotion.findUnique({
      where: { id, isDeleted: false },
      include: {
        translations: true,
      },
    });

    if (!promotion) {
      throw new NotFoundException(`Room promotion with ID ${id} not found`);
    }

    return new RoomPromotion(promotion);
  }

  async update(id: string, updateRoomPromotionDto: UpdateRoomPromotionDto): Promise<RoomPromotion> {
    return await this.prisma.$transaction(async (prisma) => {
      const { translations, applied_room_ids, ...data } = updateRoomPromotionDto;

      // Check if promotion exists
      const existing = await this.findById(id);

      // Validate rooms if provided
      if (applied_room_ids?.length > 0) {
        const roomCount = await prisma.roomDetail.count({
          where: { id: { in: applied_room_ids } },
        });
        if (roomCount !== applied_room_ids.length) {
          throw new NotFoundException('One or more room details not found');
        }
      }

      // Prepare base update data
      const updateData: Prisma.RoomPromotionUpdateInput = { ...data };

      // Atomically reset & reconnect rooms
      if (applied_room_ids !== undefined) {
        updateData.rooms = {
          set: applied_room_ids.map((roomId) => ({ id: roomId })),
        };
      }

      // Perform the promotion update
      const updatedPromotion = await prisma.roomPromotion.update({
        where: { id },
        data: updateData,
        include: { translations: true },
      });

      // Simplified translation upsert logic
      if (translations?.length > 0) {
        for (const translation of translations) {
          const match = existing.translations.find((t) => t.language === translation.language);
          if (match) {
            await prisma.promotionTranslation.update({
              where: { id: match.id },
              data: {
                language: translation.language,
                description: translation.description,
              },
            });
          } else {
            await prisma.promotionTranslation.create({
              data: {
                roomPromotionId: id,
                language: translation.language,
                description: translation.description,
              },
            });
          }
        }

        // Reload with final translations
        const finalPromotion = await prisma.roomPromotion.findUnique({
          where: { id },
          include: { translations: true },
        });
        return new RoomPromotion(finalPromotion);
      }

      return new RoomPromotion(updatedPromotion);
    });
  }

  async remove(id: string): Promise<void> {
    // Check if promotion exists
    await this.findById(id);

    await this.prisma.roomPromotion.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async restore(id: string): Promise<RoomPromotion> {
    const promotion = await this.prisma.roomPromotion.findUnique({
      where: { id, isDeleted: true },
    });

    if (!promotion) {
      throw new NotFoundException(`Room promotion with ID ${id} not found or is not deleted`);
    }

    const restored = await this.prisma.roomPromotion.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
      include: {
        translations: true,
      },
    });

    return new RoomPromotion(restored);
  }

  async findDeleted() {
    const promotions = await this.prisma.roomPromotion.findMany({
      where: { isDeleted: true },
      include: {
        translations: true,
        rooms: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return promotions.map((promotion) => new RoomPromotion(promotion));
  }

  async validatePromotionCode(code: string, roomDetailId: string) {
    const now = new Date();

    const promotion = await this.prisma.roomPromotion.findFirst({
      where: {
        code: { equals: code, mode: 'insensitive' },
        start_date: { lte: now },
        end_date: { gte: now },
        isDeleted: false,
        rooms: {
          some: {
            id: roomDetailId,
          },
        },
      },
      include: {
        translations: true,
      },
    });

    if (!promotion) {
      throw new NotFoundException('Invalid or expired promotion code for this room');
    }

    // Check usage limits
    if (promotion.total_code !== null && promotion.total_used >= promotion.total_code) {
      throw new NotFoundException('Promotion code usage limit reached');
    }

    return new RoomPromotion(promotion);
  }
}
