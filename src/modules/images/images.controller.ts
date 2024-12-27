import {
  Controller,
  Get,
  Post,
  Param,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  UseGuards,
  UploadedFile,
} from '@nestjs/common';
import { ImagesService } from './images.service';
import {
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiPayloadTooLargeResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ImageUploadResponseDto } from './dto';
import { Public, Roles } from '@/modules/auth/decorators';
import {
  CLOUDINARY_ALLOW_IMAGE_FORMATS,
  IMAGE_FILE_MAX_SIZE_IN_BYTES,
  IMAGE_FILE_MAX_SIZE_IN_MB,
  MULTI_IMAGE_FILE_MAX_COUNT,
  ICON_FILE_MAX_SIZE_IN_BYTES,
  ICON_FILE_MAX_SIZE_IN_MB,
} from '@/third-party/cloudinary/cloudinary.constant';
import { FilesInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '@/modules/auth/guards';
import { UserRole } from '@prisma/client';

@ApiTags('images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Public()
  @ApiOperation({
    summary: 'Get image by public id',
  })
  @ApiParam({
    name: 'publicId',
    type: String,
    description: 'Public ID of the image',
    required: true,
  })
  @ApiOkResponse({
    description: 'Image found',
    type: ImageUploadResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Image not found',
  })
  @Get('/:publicId')
  async getImageByPublicId(@Param('publicId') publicId: string) {
    return this.imagesService.getImageByPublicId(publicId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiOperation({
    summary: 'Upload multiple image',
  })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({
    description: 'Images uploaded',
    type: ImageUploadResponseDto,
    isArray: true,
  })
  @ApiPayloadTooLargeResponse({
    description: `Image size too large, maximum ${IMAGE_FILE_MAX_SIZE_IN_MB} MB, and maximum ${MULTI_IMAGE_FILE_MAX_COUNT} images`,
  })
  @UseInterceptors(
    FilesInterceptor('images', MULTI_IMAGE_FILE_MAX_COUNT, {
      limits: {
        files: MULTI_IMAGE_FILE_MAX_COUNT,
        fileSize: IMAGE_FILE_MAX_SIZE_IN_BYTES,
      },
      fileFilter: (req, file, cb) => {
        if (
          !new RegExp(`\\.(${CLOUDINARY_ALLOW_IMAGE_FORMATS.join('|')})$`).exec(
            file.originalname?.toLowerCase(),
          )
        ) {
          return cb(
            new BadRequestException(
              `Only ${CLOUDINARY_ALLOW_IMAGE_FORMATS.join(', ')} files are allowed!`,
            ),
            false,
          );
        }

        if (file.size > IMAGE_FILE_MAX_SIZE_IN_BYTES) {
          return cb(
            new BadRequestException(
              `File size should be less than ${IMAGE_FILE_MAX_SIZE_IN_MB} MB`,
            ),
            false,
          );
        }

        cb(null, true);
      },
    }),
  )
  @Post()
  async uploadImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: IMAGE_FILE_MAX_SIZE_IN_BYTES }),
          new FileTypeValidator({
            fileType: 'image',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    images: Express.Multer.File[],
  ): Promise<(ImageUploadResponseDto | undefined)[]> {
    return this.imagesService.uploadImages({
      images,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Upload amenity icon',
  })
  @ApiConsumes('multipart/form-data')
  @ApiCreatedResponse({
    description: 'Icon uploaded',
    type: ImageUploadResponseDto,
  })
  @ApiPayloadTooLargeResponse({
    description: `Icon size too large, maximum ${ICON_FILE_MAX_SIZE_IN_MB} MB`,
  })
  @UseInterceptors(
    FileInterceptor('icon', {
      limits: {
        fileSize: ICON_FILE_MAX_SIZE_IN_BYTES,
      },
      fileFilter: (req, file, cb) => {
        if (!new RegExp(`\\.(${CLOUDINARY_ALLOW_IMAGE_FORMATS.join('|')})$`).exec(
          file.originalname?.toLowerCase(),
        )) {
          return cb(
            new BadRequestException(
              `Only ${CLOUDINARY_ALLOW_IMAGE_FORMATS.join(', ')} files are allowed!`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @Post('icon')
  async uploadIcon(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: ICON_FILE_MAX_SIZE_IN_BYTES }),
          new FileTypeValidator({
            fileType: 'image',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    icon: Express.Multer.File,
  ): Promise<ImageUploadResponseDto> {
    return this.imagesService.uploadIcon(icon);
  }
}
