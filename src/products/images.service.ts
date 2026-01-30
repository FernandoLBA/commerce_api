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

    // Get the highest displayOrder for this product
    const maxOrder = await this.imagesRepository
      .createQueryBuilder('image')
      .where('image.productId = :productId', { productId })
      .select('MAX(image.displayOrder)', 'maxOrder')
      .getRawOne();

    const displayOrder = createImageDto.displayOrder ?? (maxOrder?.maxOrder ?? -1) + 1;

    const image = this.imagesRepository.create({
      url: createImageDto.url,
      alt: createImageDto.alt,
      displayOrder,
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
    options?: { alt?: string },
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

    // Get next displayOrder
    const maxOrder = await this.imagesRepository
      .createQueryBuilder('image')
      .where('image.productId = :productId', { productId })
      .select('MAX(image.displayOrder)', 'maxOrder')
      .getRawOne();

    const displayOrder = (maxOrder?.maxOrder ?? -1) + 1;

    const image = this.imagesRepository.create({
      url: urls.large,
      publicId: uploadResult.publicId,
      alt: options?.alt || product.name,
      width: uploadResult.width,
      height: uploadResult.height,
      displayOrder,
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
    options?: { alt?: string },
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

    // Get next displayOrder
    const maxOrder = await this.imagesRepository
      .createQueryBuilder('image')
      .where('image.productId = :productId', { productId })
      .select('MAX(image.displayOrder)', 'maxOrder')
      .getRawOne();

    const displayOrder = (maxOrder?.maxOrder ?? -1) + 1;

    const image = this.imagesRepository.create({
      url: urls.large,
      publicId: uploadResult.publicId,
      alt: options?.alt || product.name,
      width: uploadResult.width,
      height: uploadResult.height,
      displayOrder,
      product,
    });

    return this.imagesRepository.save(image);
  }

  async findAllByProduct(productId: string): Promise<ProductImage[]> {
    return this.imagesRepository.find({
      where: { product: { id: productId } },
      order: { displayOrder: 'ASC' },
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

    if (updateImageDto.url !== undefined) {
      image.url = updateImageDto.url;
    }
    if (updateImageDto.alt !== undefined) {
      image.alt = updateImageDto.alt;
    }
    if (updateImageDto.displayOrder !== undefined) {
      image.displayOrder = updateImageDto.displayOrder;
    }

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

  async reorder(productId: string, imageIds: string[]): Promise<ProductImage[]> {
    const images = await this.findAllByProduct(productId);

    const updatePromises = imageIds.map((imageId, index) => {
      const image = images.find((img) => img.id === imageId);
      if (image) {
        image.displayOrder = index;
        return this.imagesRepository.save(image);
      }
      return Promise.resolve(null);
    });

    await Promise.all(updatePromises);
    return this.findAllByProduct(productId);
  }
}
