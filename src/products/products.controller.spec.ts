import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<ProductsService>;

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

  beforeEach(async () => {
    const mockProductsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createDto: CreateProductDto = {
        name: 'New Product',
        price: 50.0,
      };

      service.create.mockResolvedValue(mockProduct);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('findAll', () => {
    it('should return an array of products', async () => {
      const products = [mockProduct];
      service.findAll.mockResolvedValue(products);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(products);
    });
  });

  describe('findOne', () => {
    it('should return a product', async () => {
      service.findOne.mockResolvedValue(mockProduct);

      const result = await controller.findOne(mockProduct.id);

      expect(service.findOne).toHaveBeenCalledWith(mockProduct.id);
      expect(result).toEqual(mockProduct);
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateDto: UpdateProductDto = { name: 'Updated Product' };
      const updatedProduct = { ...mockProduct, ...updateDto };

      service.update.mockResolvedValue(updatedProduct);

      const result = await controller.update(mockProduct.id, updateDto);

      expect(service.update).toHaveBeenCalledWith(mockProduct.id, updateDto);
      expect(result.name).toBe('Updated Product');
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(mockProduct.id);

      expect(service.remove).toHaveBeenCalledWith(mockProduct.id);
    });
  });
});
