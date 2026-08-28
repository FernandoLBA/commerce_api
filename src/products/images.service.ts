import { Injectable } from '@nestjs/common';

import {
  CloudinaryService,
  ProductImageNotFoundException,
  ProductNotFoundException,
} from '../common';
import { PrismaService } from '../prisma';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

@Injectable()
export class ImagesService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(productId: string, createImageDto: CreateProductImageDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ProductNotFoundException(
        `Product with ID "${productId}" not found`,
      );
    }

    // Get the highest displayOrder for this product
    const maxOrderResult = await this.prisma.productImage.aggregate({
      where: { productId },
      _max: { displayOrder: true },
    });

    const displayOrder =
      createImageDto.displayOrder ??
      (maxOrderResult._max.displayOrder ?? -1) + 1;

    return this.prisma.productImage.create({
      data: {
        url: createImageDto.url,
        alt: createImageDto.alt,
        displayOrder,
        productId,
      },
    });
  }

  /**
   * Upload image file to Cloudinary and create database record
   */
  async uploadFile(
    productId: string,
    file: Express.Multer.File,
    options?: { alt?: string },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ProductNotFoundException(
        `Product with ID "${productId}" not found`,
      );
    }

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFromBuffer(
      file.buffer,
      {
        folder: `commerce-api/products/${productId}`,
      },
    );

    // Get responsive URLs
    const urls = this.cloudinaryService.getResponsiveUrls(
      uploadResult.publicId,
    );

    // Get next displayOrder
    const maxOrderResult = await this.prisma.productImage.aggregate({
      where: { productId },
      _max: { displayOrder: true },
    });

    const displayOrder = (maxOrderResult._max.displayOrder ?? -1) + 1;

    return this.prisma.productImage.create({
      data: {
        url: urls.large,
        publicId: uploadResult.publicId,
        alt: options?.alt || product.name,
        width: uploadResult.width,
        height: uploadResult.height,
        displayOrder,
        productId,
      },
    });
  }

  /**
   * Upload image from URL to Cloudinary and create database record
   */
  async uploadFromUrl(
    productId: string,
    url: string,
    options?: { alt?: string },
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ProductNotFoundException(
        `Product with ID "${productId}" not found`,
      );
    }

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFromUrl(url, {
      folder: `commerce-api/products/${productId}`,
    });

    // Get responsive URLs
    const urls = this.cloudinaryService.getResponsiveUrls(
      uploadResult.publicId,
    );

    // Get next displayOrder
    const maxOrderResult = await this.prisma.productImage.aggregate({
      where: { productId },
      _max: { displayOrder: true },
    });

    const displayOrder = (maxOrderResult._max.displayOrder ?? -1) + 1;

    return this.prisma.productImage.create({
      data: {
        url: urls.large,
        publicId: uploadResult.publicId,
        alt: options?.alt || product.name,
        width: uploadResult.width,
        height: uploadResult.height,
        displayOrder,
        productId,
      },
    });
  }

  findAllByProduct(productId: string) {
    return this.prisma.productImage.findMany({
      where: { productId },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const image = await this.prisma.productImage.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!image) {
      throw new ProductImageNotFoundException(
        `Image with ID "${id}" not found`,
      );
    }

    return image;
  }

  async update(id: string, updateImageDto: UpdateProductImageDto) {
    await this.findOne(id); // Verify exists

    return this.prisma.productImage.update({
      where: { id },
      data: updateImageDto,
    });
  }

  async remove(id: string): Promise<void> {
    const image = await this.findOne(id);

    // Delete from Cloudinary if publicId exists
    if (image.publicId) {
      await this.cloudinaryService.delete(image.publicId);
    }

    await this.prisma.productImage.delete({ where: { id } });
  }

  /**
   * Remove all images for a product (including Cloudinary cleanup)
   */
  async removeAllByProduct(productId: string): Promise<void> {
    const images = await this.findAllByProduct(productId);

    // Get all public IDs
    const publicIds = images
      .filter((img) => img.publicId)
      .map((img) => img.publicId as string);

    // Delete from Cloudinary
    if (publicIds.length > 0) {
      await this.cloudinaryService.deleteMany(publicIds);
    }

    // Delete from database
    await this.prisma.productImage.deleteMany({ where: { productId } });
  }

  async reorder(productId: string, imageIds: string[]) {
    const updatePromises = imageIds.map((imageId, index) =>
      this.prisma.productImage.update({
        where: { id: imageId },
        data: { displayOrder: index },
      }),
    );

    await Promise.all(updatePromises);
    return this.findAllByProduct(productId);
  }

  getHighestDisplayOrder() {}
}
