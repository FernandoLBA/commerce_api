import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: jest.Mocked<CategoriesService>;

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
    const mockCategoriesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: mockCategoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get(CategoriesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a category', async () => {
      const createDto: CreateCategoryDto = {
        name: 'New Category',
        description: 'New Description',
      };

      service.create.mockResolvedValue(mockCategory);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('findAll', () => {
    it('should return an array of categories', async () => {
      const categories = [mockCategory];
      service.findAll.mockResolvedValue(categories);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(categories);
    });
  });

  describe('findOne', () => {
    it('should return a category', async () => {
      service.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne(mockCategory.id);

      expect(service.findOne).toHaveBeenCalledWith(mockCategory.id);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const updateDto: UpdateCategoryDto = { name: 'Updated Category' };
      const updatedCategory = { ...mockCategory, ...updateDto };

      service.update.mockResolvedValue(updatedCategory);

      const result = await controller.update(mockCategory.id, updateDto);

      expect(service.update).toHaveBeenCalledWith(mockCategory.id, updateDto);
      expect(result.name).toBe('Updated Category');
    });
  });

  describe('remove', () => {
    it('should remove a category', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(mockCategory.id);

      expect(service.remove).toHaveBeenCalledWith(mockCategory.id);
    });
  });
});
