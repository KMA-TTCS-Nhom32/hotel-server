import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBranchDto } from './create-branch.dto';
import { NearBy } from '../models';
import { IsArray, IsString } from 'class-validator';

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @ApiProperty({
    type: [String],
    description: 'Branch amenities',
  })
  @IsArray()
  @IsString({ each: true })
  amenityIds: string[];

  @ApiProperty({
    type: [NearBy],
    description: 'Nearby locations',
  })
  nearBy: NearBy[];
}
