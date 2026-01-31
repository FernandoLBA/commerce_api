import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CategoryNotFoundException,
  CategoryAlreadyExistsException,
  CategoryHasProductsException,
} from '../common';
import { SlugService } from 'src/common/services/slug.service';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private slugService: SlugService,
  ) {}

  async create(createCategoryDto: CreateCategoryDto) {
    const existingCategory = await this.prisma.category.findFirst({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new CategoryAlreadyExistsException();
    }

    // Generate slug from name if not provided
    const slug = await this.slugService.generateSlug(
      createCategoryDto.name,
      undefined,
      this.prisma.category,
    );

    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        slug,
      },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!category) {
      throw new CategoryNotFoundException();
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new CategoryAlreadyExistsException();
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...updateCategoryDto,
        slug: updateCategoryDto.name
          ? await this.slugService.generateSlug(
              updateCategoryDto.name,
              id,
              this.prisma.category,
            )
          : undefined,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });

    if (!category) {
      throw new CategoryNotFoundException();
    }

    if (category.products && category.products.length > 0) {
      throw new CategoryHasProductsException();
    }

    await this.prisma.category.delete({ where: { id } });
  }
}
