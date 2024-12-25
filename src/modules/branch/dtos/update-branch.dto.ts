import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBranchDto } from './create-branch.dto';
import { Amenity } from '@/modules/amenities/models';

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @ApiProperty({
    type: [Amenity],
    description: 'Amenities available in the branch',
  })
  amenities: Amenity[];
}
