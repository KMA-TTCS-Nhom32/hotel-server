import { CloudinaryService } from '@/third-party/cloudinary/cloudinary.service';
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CommonErrorMessagesEnum } from 'libs/common/enums';
import { ImageUploadResponseDto } from './dto';

@Injectable()
export class ImagesService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async getImageByPublicId(publicId: string) {
    try {
      const image = await this.cloudinaryService.getImage(publicId);
      return new ImageUploadResponseDto(image);
    } catch (error) {
      if (error.http_code === 404) {
        throw new HttpException(
          {
            status: HttpStatus.UNPROCESSABLE_ENTITY,
            message: CommonErrorMessagesEnum.ImageNotFound,
          },
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }
      throw new InternalServerErrorException(CommonErrorMessagesEnum.GetImageFailed);
    }
  }

  private async uploadSingleImage(image: Express.Multer.File) {
    try {
      const uploadedImage = await this.cloudinaryService.uploadImage(image);
      return new ImageUploadResponseDto(uploadedImage);
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.GetImageFailed);
    }
  }

  async uploadImages({ images }: { images: Express.Multer.File[] }) {
    const uploadedFilenames = new Set();

    const uploadedImages = await Promise.all(
      images.map(async (image) => {
        if (!uploadedFilenames.has(image.filename)) {
          const uploadedImage = await this.uploadSingleImage(image);
          uploadedFilenames.add(image.filename);
          return uploadedImage;
        }
      }),
    );

    return uploadedImages;
  }

  async uploadIcon(icon: Express.Multer.File) {
    try {
      const uploadedIcon = await this.cloudinaryService.uploadImage(icon, true);
      return new ImageUploadResponseDto(uploadedIcon);
    } catch (error) {
      throw new InternalServerErrorException(CommonErrorMessagesEnum.GetImageFailed);
    }
  }
}
