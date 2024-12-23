import { ApiProperty } from '@nestjs/swagger';

export class AbstractModel {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ example: false, type: Boolean, description: 'Soft delete flag' })
  isDeleted?: boolean;

  @ApiProperty({
    example: null,
    type: Date,
    format: 'date-time',
    nullable: true,
    description: 'Soft delete timestamp',
  })
  deletedAt?: Date | null;

  @ApiProperty({ example: new Date(), type: Date, format: 'date-time' })
  createdAt?: Date;

  @ApiProperty({ example: new Date(), type: Date, format: 'date-time' })
  updatedAt?: Date;
}
