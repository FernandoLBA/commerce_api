import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductNotFoundException, CategoryNotFoundException } from '../common';
import { Category } from '../categories/entities/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  /**
   * Genera un slug único a partir del nombre del producto
   */
  async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    // Generar slug base del nombre
    const slug = name
      .toLowerCase()
      .normalize('NFD') // Normalizar caracteres especiales
      .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos (tildes)
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios por guiones
      .replace(/-+/g, '-'); // Remover guiones duplicados

    // Verificar si ya existe
    let finalSlug = slug;
    let count = 1;

    while (true) {
      const existingProduct = await this.productRepository.findOne({
        where: { slug: finalSlug, id: excludeId ? Not(excludeId) : undefined },
      });

      if (!existingProduct) {
        break; // Slug es único
      }

      finalSlug = `${slug}-${count++}`; // Agregar sufijo numérico
    }

    return finalSlug;
  }

  generateComparePrice = (price: number): number => {
    const randomFactor = Math.random() * (1.2 - 1.1) + 1.1; // Entre 10% y 20% más
    const comparePrice = parseFloat((price * randomFactor).toFixed(2));
    return comparePrice;
  };

  async create(createProductDto: CreateProductDto): Promise<Product> {
    if (createProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createProductDto.categoryId },
      });

      if (!category) {
        throw new CategoryNotFoundException();
      }
    }

    const product = this.productRepository.create(createProductDto);
    product.slug = await this.generateUniqueSlug(product.name);
    product.updatedAt = new Date();

    if (!product.compareAtPrice) {
      product.compareAtPrice = this.generateComparePrice(product.price);
    }

    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!product) {
      throw new ProductNotFoundException();
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new CategoryNotFoundException();
      }
    }

    Object.assign(product, updateProductDto);

    if (!product.compareAtPrice) {
      product.compareAtPrice = this.generateComparePrice(product.price);
    }

    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
