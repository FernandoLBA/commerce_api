import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';

import { FilesService } from 'src/files/files.service';
import {
  CategoryAlreadyExistsException,
  CategoryHasProductsException,
  CategoryNotFoundException,
} from '../common';
import { SlugService } from '../common/services/slug.service';
import { PrismaService } from '../prisma';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  private readonly FOLDER_PATH = '/categories';

  constructor(
    private prisma: PrismaService,
    private slugService: SlugService,
    private readonly filesService: FilesService,
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

  async findOne(search: string) {
    const isValidUUID = isUUID(search);

    const category = await this.prisma.category.findUnique({
      where: isValidUUID ? { id: search } : { slug: search },
      include: { products: true },
    });

    if (!category) {
      throw new CategoryNotFoundException();
    }

    return category;
  }

  async update(slug: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(slug);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingCategory = await this.prisma.category.findFirst({
        where: { name: updateCategoryDto.name },
      });

      if (existingCategory) {
        throw new CategoryAlreadyExistsException();
      }
    }

    if( !updateCategoryDto.image && category.image) {
      const publicId = this.filesService.getImagePublicId(category.image);
      publicId && (await this.filesService.remove(publicId));
    }

    return this.prisma.category.update({
      where: { slug },
      data: {
        ...updateCategoryDto,
        slug: updateCategoryDto.slug
          ? updateCategoryDto.slug
          : await this.slugService.generateSlug(
              updateCategoryDto.name!,
              category.id,
              this.prisma.category,
            ),
        displayOrder: updateCategoryDto.displayOrder ?? 1,
      },
    });
  }

  async uploadFile(slug: string, file: Express.Multer.File) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new CategoryNotFoundException(
        `Category with slug "${slug}" not found`,
      );
    }

    // it removes the previous image
    if (category.image) {
      const publicId = this.filesService.getImagePublicId(category.image);
      publicId && (await this.filesService.remove(publicId));
    }

    const { urls } = await this.filesService.uploadImageToCloudinary(
      file,
      `${this.FOLDER_PATH}/${slug}`,
    );

    return this.prisma.category.update({
      where: { slug },
      data: {
        ...category,
        image: urls.large,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });

    if (category?.image) {
      const publicId = this.filesService.getImagePublicId(category.image);
      publicId && (await this.filesService.remove(publicId));
    }

    if (!category) {
      throw new CategoryNotFoundException();
    }

    if (category.products && category.products.length > 0) {
      throw new CategoryHasProductsException();
    }

    await this.prisma.category.delete({ where: { id } });
  }
}
