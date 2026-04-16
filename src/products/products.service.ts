import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';

import { UploadFileDto } from 'src/files/dto';
import { FilesService } from 'src/files/files.service';
import {
  CategoryNotFoundException,
  ProductImageNotFoundException,
  ProductNotFoundException,
} from '../common';
import { SlugService } from '../common/services/slug.service';
import { PrismaService } from '../prisma';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  private readonly FOLDER_PATH = '/products';

  constructor(
    private prisma: PrismaService,
    private slugService: SlugService,
    private filesService: FilesService,
  ) {}

  async create(createProductDto: CreateProductDto) {
    if (createProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: createProductDto.categoryId },
      });

      if (!category) {
        throw new CategoryNotFoundException();
      }
    }

    const slug = await this.slugService.generateSlug(
      createProductDto.name,
      undefined,
      this.prisma.product,
    );

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        slug,
      },
      include: { category: true },
    });
  }

  async findAll(categoryId?: string) {
    return this.prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: true, images: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(search: string) {
    const isValidUUID = isUUID(search);

    const product = await this.prisma.product.findUnique({
      where: isValidUUID ? { id: search } : { slug: search },
      include: { category: true, images: true, variants: true },
    });

    if (!product) {
      throw new ProductNotFoundException();
    }

    return product;
  }

  async update(slug: string, updateProductDto: UpdateProductDto) {
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new CategoryNotFoundException();
      }
    }

    if (updateProductDto.name) {
      updateProductDto.slug = await this.slugService.generateSlug(
        updateProductDto.name,
        slug,
        this.prisma.product,
      );
    }

    return this.prisma.product.update({
      where: { slug },
      data: updateProductDto,
      include: { category: true, images: true },
    });
  }

  async uploadFiles(productId: string, files: Express.Multer.File[]) {
    const product = await this.findOne(productId);

    const uploadedImages = files.map(async (file) => {
      return await this.filesService.uploadImageToCloudinary(
        file,
        `${this.FOLDER_PATH}/${product.slug}`,
        { alt: file.filename, name: file.originalname },
      );
    });

    const resolvedUploadedImages = await Promise.all(uploadedImages);

    await this.prisma.productImage.createMany({
      data: this.imageDataNormalizer(productId, resolvedUploadedImages),
      skipDuplicates: true,
    });

    return resolvedUploadedImages;
  }

  async removeOne(slug: string): Promise<void> {
    await this.findOne(slug); // Verifica que existe
    await this.prisma.product.delete({ where: { slug } });
  }

  async deleteImage(imageId: string): Promise<string> {
    const image = await this.prisma.productImage.findUnique({
      where: { id: imageId },
    });

    if (!image) {
      throw new ProductImageNotFoundException(
        `Image with ID "${imageId}" not found`,
      );
    }

    // Eliminar de Cloudinary si publicId existe
    if (image.publicId) {
      await this.filesService.remove(image.publicId);
    }

    await this.prisma.productImage.delete({ where: { id: imageId } });

    return `Image with ID "${imageId}" has been deleted successfully.`;
  }

  imageDataNormalizer(
    productId: string,
    files: {
      urls: Record<string, string>;
      uploadFileDto: UploadFileDto | undefined;
    }[],
  ) {
    return files.map((file, index) => ({
      alt:
        file.uploadFileDto?.alt ||
        file.uploadFileDto?.name ||
        `image-${Date.now()}`,
      displayOrder: index,
      height: 50,
      width: 50,
      productId,
      url: file.urls.large,
      publicId: this.filesService.getImagePublicId(file.urls.large),
    }));
  }

  getHighestPriorityOrder() {}
}
