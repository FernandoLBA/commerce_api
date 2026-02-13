import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductNotFoundException, CategoryNotFoundException } from '../common';
import { SlugService } from '../common/services/slug.service';

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

  async findAll() {
    return this.prisma.product.findMany({
      include: { category: true, images: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true, variants: true },
    });

    if (!product) {
      throw new ProductNotFoundException();
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id); // Verifica que existe

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
        id,
        this.prisma.product,
      );
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: { category: true, images: true },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verifica que existe
    await this.prisma.product.delete({ where: { id } });
  }
}
