import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';

import { CategoryNotFoundException, ProductNotFoundException } from '../common';
import { SlugService } from '../common/services/slug.service';
import { PrismaService } from '../prisma';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private slugService: SlugService,
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
    await this.findOne(slug); // Verifica que existe

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

  async remove(slug: string): Promise<void> {
    await this.findOne(slug); // Verifica que existe
    await this.prisma.product.delete({ where: { slug } });
  }
}
