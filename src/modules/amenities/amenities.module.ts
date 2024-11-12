import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { CloudinaryModule } from '@/third-party/cloudinary/cloudinary.module';
import { AmenitiesController } from './amenities.controller';
import { AmenitiesService } from './amenities.service';

@Module({
  imports: [
    DatabaseModule,
    CloudinaryModule,
  ],
  controllers: [AmenitiesController],
  providers: [AmenitiesService],
  exports: [AmenitiesService],
})
export class AmenitiesModule {}
