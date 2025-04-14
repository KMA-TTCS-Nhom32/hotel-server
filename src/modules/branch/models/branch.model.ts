import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Image } from '@/modules/images/models';
import { AbstractModel } from 'libs/common/abstract';
import { Province } from '@/modules/provinces/models';
import { Amenity } from '@/modules/amenities/models';
import { RoomDetail } from '@/modules/room-detail/models';
import { PrismaBranch, PrismaBranchDetail } from '../interfaces';

export class NearBy {
  @ApiProperty({
    type: String,
    description: 'Name of the nearby location',
  })
  name: string;

  @ApiProperty({
    type: String,
    description: 'Distance from the branch',
  })
  distance: string;
}

export class Branch extends AbstractModel {
  constructor(data: Partial<PrismaBranch>) {
    super();

    const { translations, ...processedData } = data;

    const processedTranslations =
      translations?.map((translation) => ({
        language: translation.language,
        name: translation.name,
        description: translation.description,
        address: translation.address,
        nearBy: translation.nearBy || [],
      })) || [];

    Object.assign(this, {
      ...processedData,
      province: new Province(processedData.province),
      translations: processedTranslations,
    });
  }

  @ApiProperty({
    type: String,
    example: 'province-id-123',
    description: 'ID of the province where this branch is located',
  })
  provinceId: string;

  @ApiProperty({
    type: Province,
    description: 'Province where this branch is located',
    example: { id: 'province-id-123', name: 'Ha Noi', zip_code: '100000', slug: 'ha-noi' },
  })
  province: Province;

  @ApiProperty({
    type: Image,
    description: "Branch's thumbnail image",
  })
  thumbnail: Image;

  @ApiProperty({
    type: [Image],
    description: "Branch's image gallery",
  })
  images: Image[];

  @ApiProperty({
    type: String,
    example: 'Hotel Branch Name',
    description: "Branch's name",
  })
  name: string;

  @ApiProperty({
    type: String,
    example: 'hotel-branch-slug',
    description: "Branch's slug",
  })
  slug: string;

  @ApiProperty({
    type: String,
    example: 'Detailed description of the branch',
    description: "Branch's description",
  })
  description: string;

  @ApiProperty({
    type: String,
    example: '0123456789',
    description: "Branch's contact phone number",
  })
  phone: string;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: "Branch's active status",
  })
  is_active: boolean;

  @ApiProperty({
    type: String,
    example: '123 Hotel Street, City',
    description: "Branch's physical address",
  })
  address: string;

  //   @ApiProperty({
  //     type: Object,
  //     example: { latitude: 10.762622, longitude: 106.660172 },
  //     description: "Branch's geographical location",
  //   })
  //   location: { latitude: number; longitude: number };

  @ApiProperty({
    type: Number,
    example: 4.5,
    description: "Branch's rating",
  })
  rating: number;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        language: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        address: { type: 'string' },
        nearBy: { type: 'array', items: { type: 'object' } },
      },
    },
    description: 'List of translations for the branch',
  })
  translations: {
    language: string;
    name: string;
    description: string;
    address: string;
    nearBy: NearBy[];
  }[];
}

export class BranchDetail extends Branch {
  constructor(data: Partial<PrismaBranchDetail>) {
    const { amenities, rooms, ...processedData } = data;

    super(processedData);
    Object.assign(this, {
      ...processedData,
      amenities: amenities?.map((amenity) => new Amenity(amenity)) || [],
      rooms: rooms?.map((room) => new RoomDetail(room)) || [],
    });
  }

  @ApiProperty({
    type: [Amenity],
    description: 'Amenities available in the branch',
  })
  amenities: Amenity[];

  @ApiProperty({
    type: () => [RoomDetail], // Modified to use lazy loading
    description: 'List of rooms available in the branch',
  })
  rooms: RoomDetail[];

  @ApiProperty({
    type: [NearBy],
    description: 'Nearby locations',
    example: [{ name: 'Supermarket', distance: '1 km' }],
  })
  nearBy: NearBy[];
}
