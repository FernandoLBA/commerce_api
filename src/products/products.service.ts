import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductNotFoundException, CategoryNotFoundException } from '../common';
import { SlugService } from 'src/common/services/slug.service';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private slugService: SlugService,
  ) {}

  /**
   * Genera un slug único a partir del nombre del producto
   */
  // async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  //   // Generar slug base del nombre
  //   const slug = name
  //     .toLowerCase()
  //     .normalize('NFD') // Normalizar caracteres especiales
  //     .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (tildes)
  //     .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
  //     .trim()
  //     .replace(/\s+/g, '-') // Reemplazar espacios por guiones
  //     .replace(/-+/g, '-'); // Remover guiones duplicados

  //   // Verificar si ya existe
  //   let finalSlug = slug;
  //   let count = 1;

  //   while (true) {
  //     const existingProduct = await this.prisma.product.findFirst({
  //       where: {
  //         slug: finalSlug,
  //         ...(excludeId && { NOT: { id: excludeId } }),
  //       },
  //     });

  //     if (!existingProduct) {
  //       break; // Slug es único
  //     }

  //     finalSlug = `${slug}-${count++}`; // Agregar sufijo numérico
  //   }

  //   return finalSlug;
  // }

  generateComparePrice = (price: number): number => {
    const randomFactor = Math.random() * (1.2 - 1.1) + 1.1; // Entre 10% y 20% más
    const comparePrice = parseFloat((price * randomFactor).toFixed(2));
    return comparePrice;
  };

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

    const compareAtPrice =
      createProductDto.compareAtPrice ??
      this.generateComparePrice(createProductDto.price);

    return this.prisma.product.create({
      data: {
        ...createProductDto,
        slug,
        compareAtPrice,
      },
      include: { category: true },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
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
      include: { category: true },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verifica que existe
    await this.prisma.product.delete({ where: { id } });
  }
}
