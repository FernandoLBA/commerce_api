import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from './entities/product-variant.entity';
import { Product } from './entities/product.entity';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';
import { AttributesService } from './attributes.service';
import {
  ProductNotFoundException,
  ProductVariantNotFoundException,
  ProductSkuExistsException,
} from '../common';

@Injectable()
export class VariantsService {
  constructor(
    @InjectRepository(ProductVariant)
    private variantsRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    private attributesService: AttributesService,
  ) {}

  async create(createVariantDto: CreateVariantDto): Promise<ProductVariant> {
    const { productId, sku, attributeValueIds, ...variantData } =
      createVariantDto;

    // Verify product exists
    const product = await this.productsRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new ProductNotFoundException(
        `Product with ID "${productId}" not found`,
      );
    }

    // Check SKU uniqueness
    const existingSku = await this.variantsRepository.findOne({
      where: { sku },
    });

    if (existingSku) {
      throw new ProductSkuExistsException(`SKU "${sku}" already exists`);
    }

    // Get attribute values
    const attributeValues =
      await this.attributesService.findAttributeValuesByIds(attributeValueIds);

    const variant = this.variantsRepository.create({
      ...variantData,
      sku,
      product,
      attributeValues,
    });

    // Update product to have variants
    if (!product.hasVariants) {
      product.hasVariants = true;
      await this.productsRepository.save(product);
    }

    return this.variantsRepository.save(variant);
  }

  async findAllByProduct(productId: string): Promise<ProductVariant[]> {
    return this.variantsRepository.find({
      where: { product: { id: productId } },
      relations: ['attributeValues', 'attributeValues.attribute'],
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ProductVariant> {
    const variant = await this.variantsRepository.findOne({
      where: { id },
      relations: ['product', 'attributeValues', 'attributeValues.attribute'],
    });

    if (!variant) {
      throw new ProductVariantNotFoundException(
        `Variant with ID "${id}" not found`,
      );
    }

    return variant;
  }

  async findBySku(sku: string): Promise<ProductVariant> {
    const variant = await this.variantsRepository.findOne({
      where: { sku },
      relations: ['product', 'attributeValues', 'attributeValues.attribute'],
    });

    if (!variant) {
      throw new ProductVariantNotFoundException(
        `Variant with SKU "${sku}" not found`,
      );
    }

    return variant;
  }

  async update(
    id: string,
    updateVariantDto: UpdateVariantDto,
  ): Promise<ProductVariant> {
    const variant = await this.findOne(id);

    // Check SKU uniqueness if updating SKU
    if (updateVariantDto.sku && updateVariantDto.sku !== variant.sku) {
      const existingSku = await this.variantsRepository.findOne({
        where: { sku: updateVariantDto.sku },
      });

      if (existingSku) {
        throw new ProductSkuExistsException(
          `SKU "${updateVariantDto.sku}" already exists`,
        );
      }
    }

    // Update attribute values if provided
    if (updateVariantDto.attributeValueIds) {
      variant.attributeValues =
        await this.attributesService.findAttributeValuesByIds(
          updateVariantDto.attributeValueIds,
        );
    }

    const { attributeValueIds, ...updateData } = updateVariantDto;
    Object.assign(variant, updateData);

    return this.variantsRepository.save(variant);
  }

  async remove(id: string): Promise<void> {
    const variant = await this.findOne(id);
    await this.variantsRepository.remove(variant);
  }

  async updateStock(id: string, quantity: number): Promise<ProductVariant> {
    const variant = await this.findOne(id);
    variant.stock = Math.max(0, variant.stock + quantity);
    return this.variantsRepository.save(variant);
  }

  async checkAvailability(id: string, quantity: number): Promise<boolean> {
    const variant = await this.findOne(id);
    return variant.isActive && variant.stock >= quantity;
  }
}
