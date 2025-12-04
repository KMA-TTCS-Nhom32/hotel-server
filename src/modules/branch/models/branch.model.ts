import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Image } from '@/modules/images/models';
import { AbstractModel } from 'libs/common/abstract';
import { Province } from '@/modules/provinces/models';
import { Amenity } from '@/modules/amenities/models';
import { RoomDetail } from '@/modules/room-detail/models';
import { PrismaBranch, PrismaBranchDetail } from '../interfaces';
import { Language } from '@prisma/client';
import { getTranslation, getAvailableLanguages } from '@/common/utils/translation.util';
import { IsNotEmpty, IsString, IsNumberString } from 'class-validator';

export class NearBy {
  @ApiProperty({
    type: String,
    description: 'Name of the nearby location',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Distance from the branch',
  })
  @IsNotEmpty()
  @IsString()
  distance: string;
}

export class Location {
  @ApiProperty({
    type: String,
    description: 'Latitude of the location',
    example: '21.028511',
  })
  @IsNotEmpty()
  @IsNumberString()
  latitude: string;

  @ApiProperty({
    type: String,
    description: 'Longitude of the location',
    example: '105.804817',
  })
  @IsNotEmpty()
  @IsNumberString()
  longitude: string;
}

export class Branch extends AbstractModel {
  constructor(data: Partial<PrismaBranch>, preferredLanguage?: Language) {
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

    // Store available languages
    const availableLanguages = getAvailableLanguages({
      translations: processedTranslations,
    });

    Object.assign(this, {
      ...processedData,
      province: new Province(processedData.province),
      translations: processedTranslations,
      availableLanguages,
    });

    // Apply the preferred language if specified (this will enhance the model
    // with the preferred language but still keep all translations)
    if (preferredLanguage && processedTranslations.length > 0) {
      this.name = getTranslation<Branch>(
        { ...this, translations: processedTranslations },
        'name',
        preferredLanguage,
      );

      this.description = getTranslation<Branch>(
        { ...this, translations: processedTranslations },
        'description',
        preferredLanguage,
      );

      this.address = getTranslation<Branch>(
        { ...this, translations: processedTranslations },
        'address',
        preferredLanguage,
      );
    }
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

  @ApiPropertyOptional({
    type: Location,
    example: { latitude: 21.028511, longitude: 105.804817 },
    description: "Branch's geographical location",
  })
  location?: Location;

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
        language: { type: 'string', enum: Object.values(Language) },
        name: { type: 'string' },
        description: { type: 'string' },
        address: { type: 'string' },
        nearBy: { type: 'array', items: { type: 'object' } },
      },
    },
    description: 'List of translations for the branch',
  })
  translations: {
    language: Language;
    name: string;
    description: string;
    address: string;
    nearBy: NearBy[];
  }[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      enum: Object.values(Language),
    },
    description: 'List of available languages for this branch',
  })
  availableLanguages: Language[];
}

export class BranchDetail extends Branch {
  constructor(data: Partial<PrismaBranchDetail>, preferredLanguage?: Language) {
    const { amenities, rooms, ...processedData } = data;

    super(processedData, preferredLanguage);
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
