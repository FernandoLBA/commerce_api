import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  ProductNotFoundException,
  ProductSkuExistsException,
  ProductVariantNotFoundException,
} from '../common';
import { PrismaService } from '../prisma';
import { AttributesService } from './attributes.service';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateVariantDto } from './dto/update-variant.dto';

@Injectable()
export class VariantsService {
  constructor(
    private prisma: PrismaService,
    private attributesService: AttributesService,
  ) {}

  async create(createVariantDto: CreateVariantDto) {
    const { productId, sku, attributeValueIds, ...variantData } =
      createVariantDto;

    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new ProductNotFoundException(
        `Product with ID "${productId}" not found`,
      );
    }

    // Check SKU uniqueness
    const existingSku = await this.prisma.productVariant.findFirst({
      where: { sku },
    });

    if (existingSku) {
      throw new ProductSkuExistsException(`SKU "${sku}" already exists`);
    }

    // Get attribute values
    const attributeValues =
      await this.attributesService.findAttributeValuesByIds(attributeValueIds);

    // Create variant with attribute values
    const variant = await this.prisma.productVariant.create({
      data: {
        ...variantData,
        sku,
        productId,
        attributeValues: {
          create: attributeValues.map((av) => ({ attributeValueId: av.id })),
        },
      },
      include: {
        attributeValues: {
          include: { attributeValue: { include: { attribute: true } } },
        },
      },
    });

    // Update product to have variants
    if (!product.hasVariants) {
      await this.prisma.product.update({
        where: { id: productId },
        data: { hasVariants: true },
      });
    }

    return variant;
  }

  findAllByProduct(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId },
      include: {
        attributeValues: {
          include: { attributeValue: { include: { attribute: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true,
        attributeValues: {
          include: { attributeValue: { include: { attribute: true } } },
        },
      },
    });

    if (!variant) {
      throw new ProductVariantNotFoundException(
        `Variant with ID "${id}" not found`,
      );
    }

    return variant;
  }

  async findBySku(sku: string) {
    const variant = await this.prisma.productVariant.findFirst({
      where: { sku },
      include: {
        product: true,
        attributeValues: {
          include: { attributeValue: { include: { attribute: true } } },
        },
      },
    });

    if (!variant) {
      throw new ProductVariantNotFoundException(
        `Variant with SKU "${sku}" not found`,
      );
    }

    return variant;
  }

  async update(id: string, updateVariantDto: UpdateVariantDto) {
    const variant = await this.findOne(id);

    // Check SKU uniqueness if updating SKU
    if (updateVariantDto.sku && updateVariantDto.sku !== variant.sku) {
      const existingSku = await this.prisma.productVariant.findFirst({
        where: { sku: updateVariantDto.sku },
      });

      if (existingSku) {
        throw new ProductSkuExistsException(
          `SKU "${updateVariantDto.sku}" already exists`,
        );
      }
    }

    const { attributeValueIds, ...updateData } = updateVariantDto;

    // Build update data
    const prismaUpdateData: Prisma.ProductVariantUpdateInput = {
      ...updateData,
    };

    // Update attribute values if provided
    if (attributeValueIds) {
      const attributeValues =
        await this.attributesService.findAttributeValuesByIds(
          attributeValueIds,
        );

      prismaUpdateData.attributeValues = {
        deleteMany: {},
        create: attributeValues.map((av) => ({ attributeValueId: av.id })),
      };
    }

    return this.prisma.productVariant.update({
      where: { id },
      data: prismaUpdateData,
      include: {
        attributeValues: {
          include: { attributeValue: { include: { attribute: true } } },
        },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.productVariant.delete({ where: { id } });
  }

  async updateStock(id: string, quantity: number) {
    const variant = await this.findOne(id);
    const stock = Math.max(0, variant.stock + Number(quantity));

    return this.prisma.productVariant.update({
      where: { id },
      data: { stock },
    });
  }

  async checkAvailability(id: string, quantity: number): Promise<boolean> {
    const variant = await this.findOne(id);
    return variant.isActive && variant.stock >= quantity;
  }
}
