import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import {
  CategoryNotFoundException,
  CategoryAlreadyExistsException,
  CategoryHasProductsException,
} from '../common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoryRepository: jest.Mocked<Repository<Category>>;

  const mockCategory: Category = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Category',
    description: 'Test Description',
    isActive: true,
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockCategoryRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    categoryRepository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createDto = {
        name: 'New Category',
        description: 'New Description',
      };

      categoryRepository.findOne.mockResolvedValue(null);
      categoryRepository.create.mockReturnValue(mockCategory);
      categoryRepository.save.mockResolvedValue(mockCategory);

      const result = await service.create(createDto);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { name: createDto.name },
      });
      expect(categoryRepository.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCategory);
    });

    it('should throw CategoryAlreadyExistsException if name exists', async () => {
      const createDto = {
        name: 'Existing Category',
      };

      categoryRepository.findOne.mockResolvedValue(mockCategory);

      await expect(service.create(createDto)).rejects.toThrow(
        CategoryAlreadyExistsException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      const categories = [mockCategory];
      categoryRepository.find.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(categoryRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
      expect(result).toEqual(categories);
    });
  });

  describe('findOne', () => {
    it('should return a category if found', async () => {
      categoryRepository.findOne.mockResolvedValue(mockCategory);

      const result = await service.findOne(mockCategory.id);

      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        relations: ['products'],
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw CategoryNotFoundException if not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        CategoryNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateDto = { description: 'Updated Description' };
      const updatedCategory = { ...mockCategory, ...updateDto };

      categoryRepository.findOne.mockResolvedValue(mockCategory);
      categoryRepository.save.mockResolvedValue(updatedCategory);

      const result = await service.update(mockCategory.id, updateDto);

      expect(result.description).toBe('Updated Description');
    });

    it('should throw CategoryNotFoundException if not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { name: 'Test' }),
      ).rejects.toThrow(CategoryNotFoundException);
    });

    it('should throw CategoryAlreadyExistsException if new name already exists', async () => {
      const updateDto = { name: 'Existing Name' };
      const existingCategory = { ...mockCategory, id: 'different-id' };

      categoryRepository.findOne
        .mockResolvedValueOnce(mockCategory) // findOne for the category to update
        .mockResolvedValueOnce(existingCategory); // findOne for name check

      await expect(service.update(mockCategory.id, updateDto)).rejects.toThrow(
        CategoryAlreadyExistsException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a category without products', async () => {
      const categoryWithoutProducts = { ...mockCategory, products: [] };
      categoryRepository.findOne.mockResolvedValue(categoryWithoutProducts);
      categoryRepository.remove.mockResolvedValue(categoryWithoutProducts);

      await service.remove(mockCategory.id);

      expect(categoryRepository.remove).toHaveBeenCalledWith(
        categoryWithoutProducts,
      );
    });

    it('should throw CategoryNotFoundException if not found', async () => {
      categoryRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        CategoryNotFoundException,
      );
    });

    it('should throw CategoryHasProductsException if category has products', async () => {
      const categoryWithProducts = {
        ...mockCategory,
        products: [{ id: 'product-1' }],
      };
      categoryRepository.findOne.mockResolvedValue(categoryWithProducts);

      await expect(service.remove(mockCategory.id)).rejects.toThrow(
        CategoryHasProductsException,
      );
    });
  });
});
