import { Injectable } from '@nestjs/common';
import { UploadFileDto } from 'src/files/dto';
import { FilesService } from 'src/files/files.service';

import { PrismaService } from 'src/prisma';

@Injectable()
export class ProductImageService {
  private IMAGE_ALT: string = `image-${Date.now()}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
  ) {}

  async createBulkImages(
    productId: string,
    files: {
      urls: Record<string, string>;
      uploadFileDto: UploadFileDto | undefined;
    }[],
  ) {
    return await this.prisma.productImage.createMany({
      data: this.imageDataNormalizer(productId, files),
      skipDuplicates: true,
    });
  }

  imageDataNormalizer(
    productId: string,
    files: {
      urls: Record<string, string>;
      uploadFileDto: UploadFileDto | undefined;
    }[],
  ) {
    return files.map((file, index) => ({
      alt: file.uploadFileDto?.alt || this.IMAGE_ALT,
      displayOrder: index,
      height: 50,
      width: 50,
      productId,
      url: file.urls.large,
      publicId: this.filesService.getImagePublicId(file.urls.large),
    }));
  }
}
