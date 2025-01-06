import { Image } from '@/modules/images/models';
import { ApiProperty } from '@nestjs/swagger';

export enum GuestIdentificationCard {
  CCCD = 'CCCD',
  CMND = 'CMND',
  CMT = 'CMT',
}

export class GuestDetail {
  @ApiProperty({
    type: String,
    example: '001202014460',
    description: 'Guest identification number',
  })
  identification_number: string;

  @ApiProperty({
    type: String,
    enum: GuestIdentificationCard,
    example: GuestIdentificationCard.CCCD,
    description: 'Guest identification card type',
  })
  identification_card: GuestIdentificationCard;

  @ApiProperty({
    type: Image,
    description: 'Front image of the guest identification card',
  })
  front_image: Image;

  @ApiProperty({
    type: Image,
    description: 'Back image of the guest identification card',
  })
  back_image: Image;
}
