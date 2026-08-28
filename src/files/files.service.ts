import { Injectable } from '@nestjs/common';
import { v2 } from 'cloudinary';
import * as streamifier from 'streamifier';

import { CloudinaryService } from 'src/common';
import { UploadFileDto } from './dto';

@Injectable()
export class FilesService {
  private cloudinary = v2;
  private streamifier = streamifier;

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadImageToCloudinary(
    file: Express.Multer.File,
    folderPath: string,
    uploadFileDto?: UploadFileDto,
  ) {
    const uploadResult = await this.cloudinaryService.uploadFromBuffer(
      file.buffer,
      {
        folder: this.getFolderName(folderPath),
      },
    );

    const urls = this.cloudinaryService.getResponsiveUrls(
      uploadResult.publicId,
    );

    return {
      uploadFileDto,
      urls,
    };
  }

  async uploadMultipleImagesToCloudinary(
    files: Express.Multer.File[],
    folderPath: string,
  ) {
    const uploadPromises = files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = this.cloudinary.uploader.upload_stream(
          {
            folder: folderPath,
          },
          (error, result) => {
            if (error) return reject(new Error(error.message));

            resolve(result);
          },
        );

        this.streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    });

    return Promise.all(uploadPromises);
  }

  findAll() {
    return `This action returns all files`;
  }

  findOne(id: number) {
    return `This action returns a #${id} file`;
  }

  update(id: number) {
    return `This action updates a #${id} file`;
  }

  async remove(publicId: string) {
    return await this.cloudinaryService.delete(publicId);
  }

  getImagePublicId(imageUrl: string, depth = -4) {
    if (!imageUrl) return null;

    return imageUrl.split('/').slice(depth).join('/').split('?')[0];
  }

  getFolderName(folderPath: string) {
    return `commerce${folderPath}`;
  }
}
