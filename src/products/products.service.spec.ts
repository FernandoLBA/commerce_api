import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import {
  ProductNotFoundException,
  CategoryNotFoundException,
} from '../common';

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepository: jest.Mocked<Repository<Product>>;
  let categoryRepository: jest.Mocked<Repository<Category>>;

  const mockProduct: Product = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    stock: 10,
    isActive: true,
    categoryId: null,
    category: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCategory: Category = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    name: 'Test Category',
    description: 'Test Category Description',
    isActive: true,
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockProductRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const mockCategoryRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    productRepository = module.get(getRepositoryToken(Product));
    categoryRepository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product without category', async () => {
      const createDto = {
        name: 'New Product',
        price: 50.0,
        stock: 5,
      };

      productRepository.create.mockReturnValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(productRepository.create).toHaveBeenCalledWith(createDto);
      expect(productRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('should create a product with valid category', async () => {
      const createDto = {
        name: 'New Product',
        price: 50.0,
        categoryId: mockCategory.id,
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory);
      productRepository.create.mockReturnValue(mockProduct);
      productRepository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw CategoryNotFoundException if category does not exist', async () => {
      const createDto = {
        name: 'New Product',
        price: 50.0,
        categoryId: 'invalid-id',
      };

      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        CategoryNotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const products = [mockProduct];
      productRepository.find.mockResolvedValue(products);

      const result = await service.findAll();

      expect(productRepository.find).toHaveBeenCalledWith({
        relations: ['category'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(products);
    });
  });

  describe('findOne', () => {
    it('should return a product if found', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockProduct.id);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        relations: ['category'],
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw ProductNotFoundException if product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        ProductNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto = { name: 'Updated Product' };
      const updatedProduct = { ...mockProduct, ...updateDto };

      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.save.mockResolvedValue(updatedProduct);

      const result = await service.update(mockProduct.id, updateDto);

      expect(result.name).toBe('Updated Product');
    });

    it('should throw ProductNotFoundException if product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { name: 'Test' }),
      ).rejects.toThrow(ProductNotFoundException);
    });

    it('should throw CategoryNotFoundException if updating with invalid category', async () => {
      const updateDto = { categoryId: 'invalid-category-id' };

      productRepository.findOne.mockResolvedValue(mockProduct);
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.update(mockProduct.id, updateDto)).rejects.toThrow(
        CategoryNotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct);
      productRepository.remove.mockResolvedValue(mockProduct);

      await service.remove(mockProduct.id);

      expect(productRepository.remove).toHaveBeenCalledWith(mockProduct);
    });

    it('should throw ProductNotFoundException if product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        ProductNotFoundException,
      );
    });
  });
});
