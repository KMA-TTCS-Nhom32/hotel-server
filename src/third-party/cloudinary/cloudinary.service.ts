import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { Readable } from 'stream';

import { CloudinaryResponse } from './cloudinary-response';
import {
  CLOUDINARY_ALLOW_IMAGE_FORMATS,
  CLOUDINARY_AMENITY_ICONS_FOLDER,
  CLOUDINARY_ROOT_FOLDER_NAME,
} from './cloudinary.constant';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
    isUploadingIcon: boolean = false,
  ): Promise<CloudinaryResponse> {
    const options: UploadApiOptions = {
      folder: isUploadingIcon ? CLOUDINARY_AMENITY_ICONS_FOLDER : CLOUDINARY_ROOT_FOLDER_NAME,
      allowedFormats: CLOUDINARY_ALLOW_IMAGE_FORMATS,
      transformation: isUploadingIcon
        ? {
            width: 64,
            height: 64,
            crop: 'fill',
            format: 'svg',
            quality: 'auto',
          }
        : {
            format: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
            dpr: 'auto',
          },
    };

    const uploadPromise = new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });

      // Create a Readable stream from the file buffer and pipe it to uploadStream
      const readableStream = new Readable();
      readableStream.push(file.buffer);
      readableStream.push(null); // Signify the end of the stream
      readableStream.pipe(uploadStream);
    });

    const response = await uploadPromise;

    return {
      ...response,
      url: response.url,
      secure_url: response.secure_url,
    };
  }

  async getImage(publicId: string): Promise<CloudinaryResponse> {
    const getImagePromise = new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.api.resource(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });

    const response = await getImagePromise;

    return {
      ...response,
      url: response.url,
      secure_url: response.secure_url,
    };
  }

  deleteImage(publicId: string): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
}
