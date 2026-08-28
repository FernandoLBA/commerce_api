import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma';
import { SlugService } from '../common/services/slug.service';
import { FilesService } from '../files/files.service';
import {
  CategoryNotFoundException,
  CategoryAlreadyExistsException,
  CategoryHasProductsException,
} from '../common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockCategory = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Category',
    slug: 'test-category',
    description: 'Test Description',
    image: null,
    parentId: null,
    isActive: true,
    displayOrder: 0,
    products: [],
    children: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSlugService = {
    generateSlug: jest.fn().mockResolvedValue('test-category'),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      category: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SlugService,
          useValue: mockSlugService,
        },
        {
          provide: FilesService,
          useValue: { getImagePublicId: jest.fn(), remove: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get(PrismaService);
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

      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue(mockCategory);

      const result = await service.create(createDto);

      expect(prisma.category.findFirst).toHaveBeenCalled();
      expect(prisma.category.create).toHaveBeenCalled();
      expect(result).toEqual(mockCategory);
    });

    it('should throw CategoryAlreadyExistsException if name exists', async () => {
      const createDto = {
        name: 'Existing Category',
      };

      prisma.category.findFirst.mockResolvedValue(mockCategory);

      await expect(service.create(createDto)).rejects.toThrow(
        CategoryAlreadyExistsException,
      );
    });
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      const categories = [mockCategory];
      prisma.category.findMany.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(prisma.category.findMany).toHaveBeenCalled();
      expect(result).toEqual(categories);
    });
  });

  describe('findOne', () => {
    it('should return a category if found', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findOne(mockCategory.id);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw CategoryNotFoundException if not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        CategoryNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateDto = { description: 'Updated Description' };
      const updatedCategory = { ...mockCategory, ...updateDto };

      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.update.mockResolvedValue(updatedCategory);

      const result = await service.update(mockCategory.id, updateDto);

      expect(result.description).toBe('Updated Description');
    });

    it('should throw CategoryNotFoundException if not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', { name: 'Test' }),
      ).rejects.toThrow(CategoryNotFoundException);
    });

    it('should throw CategoryAlreadyExistsException if new name already exists', async () => {
      const updateDto = { name: 'Existing Name' };
      const existingCategory = { ...mockCategory, id: 'different-id' };

      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.category.findFirst.mockResolvedValue(existingCategory);

      await expect(service.update(mockCategory.id, updateDto)).rejects.toThrow(
        CategoryAlreadyExistsException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a category without products', async () => {
      const categoryWithoutProducts = {
        ...mockCategory,
        products: [],
        _count: { products: 0 },
      };
      prisma.category.findUnique.mockResolvedValue(categoryWithoutProducts);
      prisma.category.delete.mockResolvedValue(categoryWithoutProducts);

      await service.remove(mockCategory.id);

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: mockCategory.id },
      });
    });

    it('should throw CategoryNotFoundException if not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        CategoryNotFoundException,
      );
    });

    it('should throw CategoryHasProductsException if category has products', async () => {
      const categoryWithProducts = {
        ...mockCategory,
        products: [{ id: 'product-1' }],
        _count: { products: 1 },
      };
      prisma.category.findUnique.mockResolvedValue(categoryWithProducts);

      await expect(service.remove(mockCategory.id)).rejects.toThrow(
        CategoryHasProductsException,
      );
    });
  });
});
