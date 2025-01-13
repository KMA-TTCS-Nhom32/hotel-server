import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

export class ImmediateDeleteRoomsDto {
  @ApiProperty({
    type: [String],
    description: 'List of room ids to delete',
  })
  @ValidateNested()
  @Type(() => String)
  @IsArray()
  ids: string[];
}
