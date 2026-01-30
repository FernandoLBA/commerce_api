import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from './entities/product-image.entity';
import { Product } from './entities/product.entity';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductNotFoundException, ProductImageNotFoundException, CloudinaryService } from '../common';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private imagesRepository: Repository<ProductImage>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(productId: string, createImageDto: CreateProductImageDto): Promise<ProductImage> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new ProductNotFoundException(`Product with ID "${productId}" not found`);
    }

    // If this is the first image or marked as primary, handle primary flag
    if (createImageDto.isPrimary) {
      await this.resetPrimaryImages(productId);
    }

    // Get the highest position for this product
    const maxPosition = await this.imagesRepository
      .createQueryBuilder('image')
      .where('image.productId = :productId', { productId })
      .select('MAX(image.position)', 'maxPosition')
      .getRawOne();

    const position = createImageDto.position ?? (maxPosition?.maxPosition ?? -1) + 1;

    const image = this.imagesRepository.create({
      ...createImageDto,
      position,
      product,
    });

    return this.imagesRepository.save(image);
  }

  /**
   * Upload image file to Cloudinary and create database record
   */
  async uploadFile(
    productId: string,
    file: Express.Multer.File,
    options?: { altText?: string; isPrimary?: boolean },
  ): Promise<ProductImage> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new ProductNotFoundException(`Product with ID "${productId}" not found`);
    }

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFromBuffer(file.buffer, {
      folder: `commerce-api/products/${productId}`,
    });

    // Get responsive URLs
    const urls = this.cloudinaryService.getResponsiveUrls(uploadResult.publicId);

    // Handle primary flag
    if (options?.isPrimary) {
      await this.resetPrimaryImages(productId);
    }

    // Get next position
    const maxPosition = await this.imagesRepository
      .createQueryBuilder('image')
      .where('image.productId = :productId', { productId })
      .select('MAX(image.position)', 'maxPosition')
      .getRawOne();

    const position = (maxPosition?.maxPosition ?? -1) + 1;

    // Check if this is the first image (make it primary automatically)
    const imageCount = await this.imagesRepository.count({
      where: { product: { id: productId } },
    });

    const image = this.imagesRepository.create({
      url: urls.large,
      thumbnailUrl: urls.thumbnail,
      publicId: uploadResult.publicId,
      altText: options?.altText || product.name,
      position,
      isPrimary: options?.isPrimary || imageCount === 0,
      product,
    });

    return this.imagesRepository.save(image);
  }

  /**
   * Upload image from URL to Cloudinary and create database record
   */
  async uploadFromUrl(
    productId: string,
    url: string,
    options?: { altText?: string; isPrimary?: boolean },
  ): Promise<ProductImage> {
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new ProductNotFoundException(`Product with ID "${productId}" not found`);
    }

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadFromUrl(url, {
      folder: `commerce-api/products/${productId}`,
    });

    // Get responsive URLs
    const urls = this.cloudinaryService.getResponsiveUrls(uploadResult.publicId);

    // Handle primary flag
    if (options?.isPrimary) {
      await this.resetPrimaryImages(productId);
    }

    // Get next position
    const maxPosition = await this.imagesRepository
      .createQueryBuilder('image')
      .where('image.productId = :productId', { productId })
      .select('MAX(image.position)', 'maxPosition')
      .getRawOne();

    const position = (maxPosition?.maxPosition ?? -1) + 1;

    // Check if this is the first image
    const imageCount = await this.imagesRepository.count({
      where: { product: { id: productId } },
    });

    const image = this.imagesRepository.create({
      url: urls.large,
      thumbnailUrl: urls.thumbnail,
      publicId: uploadResult.publicId,
      altText: options?.altText || product.name,
      position,
      isPrimary: options?.isPrimary || imageCount === 0,
      product,
    });

    return this.imagesRepository.save(image);
  }

  async findAllByProduct(productId: string): Promise<ProductImage[]> {
    return this.imagesRepository.find({
      where: { product: { id: productId } },
      order: { position: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ProductImage> {
    const image = await this.imagesRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!image) {
      throw new ProductImageNotFoundException(`Image with ID "${id}" not found`);
    }

    return image;
  }

  async update(id: string, updateImageDto: UpdateProductImageDto): Promise<ProductImage> {
    const image = await this.findOne(id);

    // If setting as primary, reset other primary images
    if (updateImageDto.isPrimary && !image.isPrimary) {
      await this.resetPrimaryImages(image.product.id);
    }

    Object.assign(image, updateImageDto);
    return this.imagesRepository.save(image);
  }

  async remove(id: string): Promise<void> {
    const image = await this.findOne(id);

    // Delete from Cloudinary if publicId exists
    if (image.publicId) {
      await this.cloudinaryService.delete(image.publicId);
    }

    await this.imagesRepository.remove(image);
  }

  /**
   * Remove all images for a product (including Cloudinary cleanup)
   */
  async removeAllByProduct(productId: string): Promise<void> {
    const images = await this.findAllByProduct(productId);

    // Get all public IDs
    const publicIds = images
      .filter((img) => img.publicId)
      .map((img) => img.publicId);

    // Delete from Cloudinary
    if (publicIds.length > 0) {
      await this.cloudinaryService.deleteMany(publicIds);
    }

    // Delete from database
    await this.imagesRepository.remove(images);
  }

  async setPrimary(id: string): Promise<ProductImage> {
    const image = await this.findOne(id);
    await this.resetPrimaryImages(image.product.id);

    image.isPrimary = true;
    return this.imagesRepository.save(image);
  }

  async reorder(productId: string, imageIds: string[]): Promise<ProductImage[]> {
    const images = await this.findAllByProduct(productId);

    const updatePromises = imageIds.map((imageId, index) => {
      const image = images.find((img) => img.id === imageId);
      if (image) {
        image.position = index;
        return this.imagesRepository.save(image);
      }
      return Promise.resolve(null);
    });

    await Promise.all(updatePromises);
    return this.findAllByProduct(productId);
  }

  private async resetPrimaryImages(productId: string): Promise<void> {
    await this.imagesRepository.update(
      { product: { id: productId }, isPrimary: true },
      { isPrimary: false },
    );
  }
}
