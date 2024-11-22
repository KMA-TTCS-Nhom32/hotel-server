import { ConfigService } from '@nestjs/config';

import { v2 as cloudinary } from 'cloudinary';

import { CLOUDINARY_PROVIDER } from './cloudinary.constant';

export const CloudinaryProvider = {
  provide: CLOUDINARY_PROVIDER,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get<string>('CLOUDINARY_NAME'),
      api_key: configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  },
};