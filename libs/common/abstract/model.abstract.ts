import { ApiProperty } from "@nestjs/swagger";

export class AbstractModel {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', type: String, format: 'uuid' })
    id: string;

    @ApiProperty({ example: '2021-09-14T00:00:00.000Z', type: String, format: 'date-time' })
    createdAt?: Date;

    @ApiProperty({ example: '2021-09-14T00:00:00.000Z', type: String, format: 'date-time' })
    updatedAt?: Date;
}