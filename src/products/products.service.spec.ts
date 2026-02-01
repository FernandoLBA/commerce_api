import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma';
import { SlugService } from '../common/services/slug.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    category: {
      findUnique: jest.Mock;
    };
  };

  const mockProduct = {
    id: 'product-uuid-123',
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test product description',
    price: 99.99,
    stock: 100,
    isActive: true,
    category: { id: 'cat-1', name: 'Electronics' },
    images: [],
  };

  const mockSlugService = {
    generateSlug: jest.fn().mockResolvedValue('test-product'),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SlugService,
          useValue: mockSlugService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create({
        name: 'New Product',
        description: 'Description',
        price: 99.99,
      });

      expect(prisma.product.create).toHaveBeenCalled();
      expect(result.name).toBe('Test Product');
    });
  });

  describe('findAll', () => {
    it('should return all products', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockProduct.id);

      expect(result.name).toBe('Test Product');
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated Product',
      });

      const result = await service.update(mockProduct.id, {
        name: 'Updated Product',
      });

      expect(result.name).toBe('Updated Product');
    });
  });

  describe('remove', () => {
    it('should remove a product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.delete.mockResolvedValue(mockProduct);

      await service.remove(mockProduct.id);

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
      });
    });
  });
});
