import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VariantsService } from './variants.service';
import { ProductVariant } from './entities/product-variant.entity';
import { Product } from './entities/product.entity';
import { AttributesService } from './attributes.service';
import {
  ProductNotFoundException,
  ProductVariantNotFoundException,
  ProductSkuExistsException,
} from '../common';

describe('VariantsService', () => {
  let service: VariantsService;
  let variantsRepository: jest.Mocked<Repository<ProductVariant>>;
  let productsRepository: jest.Mocked<Repository<Product>>;
  let attributesService: jest.Mocked<AttributesService>;

  const mockProduct: Partial<Product> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product',
    hasVariants: false,
  };

  const mockVariant: Partial<ProductVariant> = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    sku: 'TEST-SKU-001',
    price: 99.99,
    stock: 100,
    isActive: true,
    product: mockProduct as Product,
    attributeValues: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockVariantsRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const mockProductsRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockAttributesService = {
      findAttributeValuesByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariantsService,
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: mockVariantsRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductsRepository,
        },
        {
          provide: AttributesService,
          useValue: mockAttributesService,
        },
      ],
    }).compile();

    service = module.get<VariantsService>(VariantsService);
    variantsRepository = module.get(getRepositoryToken(ProductVariant));
    productsRepository = module.get(getRepositoryToken(Product));
    attributesService = module.get(AttributesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new variant', async () => {
      const createDto = {
        productId: mockProduct.id!,
        sku: 'NEW-SKU-001',
        price: 49.99,
        stock: 50,
        attributeValueIds: ['value-id-1'],
      };

      productsRepository.findOne.mockResolvedValue(mockProduct as Product);
      variantsRepository.findOne.mockResolvedValue(null); // No existing SKU
      attributesService.findAttributeValuesByIds.mockResolvedValue([]);
      variantsRepository.create.mockReturnValue(mockVariant as ProductVariant);
      variantsRepository.save.mockResolvedValue(mockVariant as ProductVariant);
      productsRepository.save.mockResolvedValue({
        ...mockProduct,
        hasVariants: true,
      } as Product);

      const result = await service.create(createDto);

      expect(result).toEqual(mockVariant);
      expect(productsRepository.save).toHaveBeenCalled(); // Update hasVariants
    });

    it('should throw ProductNotFoundException if product does not exist', async () => {
      const createDto = {
        productId: 'nonexistent',
        sku: 'NEW-SKU',
        price: 49.99,
        stock: 50,
        attributeValueIds: [],
      };

      productsRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        ProductNotFoundException,
      );
    });

    it('should throw ProductSkuExistsException if SKU exists', async () => {
      const createDto = {
        productId: mockProduct.id!,
        sku: 'EXISTING-SKU',
        price: 49.99,
        stock: 50,
        attributeValueIds: [],
      };

      productsRepository.findOne.mockResolvedValue(mockProduct as Product);
      variantsRepository.findOne.mockResolvedValue(
        mockVariant as ProductVariant,
      );

      await expect(service.create(createDto)).rejects.toThrow(
        ProductSkuExistsException,
      );
    });
  });

  describe('findAllByProduct', () => {
    it('should return all variants for a product', async () => {
      const variants = [mockVariant as ProductVariant];
      variantsRepository.find.mockResolvedValue(variants);

      const result = await service.findAllByProduct(mockProduct.id!);

      expect(result).toEqual(variants);
      expect(variantsRepository.find).toHaveBeenCalledWith({
        where: { product: { id: mockProduct.id } },
        relations: ['attributeValues', 'attributeValues.attribute'],
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a variant by id', async () => {
      variantsRepository.findOne.mockResolvedValue(
        mockVariant as ProductVariant,
      );

      const result = await service.findOne(mockVariant.id!);

      expect(result).toEqual(mockVariant);
    });

    it('should throw ProductVariantNotFoundException if not found', async () => {
      variantsRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        ProductVariantNotFoundException,
      );
    });
  });

  describe('findBySku', () => {
    it('should return a variant by SKU', async () => {
      variantsRepository.findOne.mockResolvedValue(
        mockVariant as ProductVariant,
      );

      const result = await service.findBySku(mockVariant.sku!);

      expect(result).toEqual(mockVariant);
    });

    it('should throw ProductVariantNotFoundException if not found', async () => {
      variantsRepository.findOne.mockResolvedValue(null);

      await expect(service.findBySku('nonexistent')).rejects.toThrow(
        ProductVariantNotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a variant', async () => {
      const updateDto = { price: 79.99 };
      const updatedVariant = { ...mockVariant, ...updateDto };

      variantsRepository.findOne.mockResolvedValue(
        mockVariant as ProductVariant,
      );
      variantsRepository.save.mockResolvedValue(
        updatedVariant as ProductVariant,
      );

      const result = await service.update(mockVariant.id!, updateDto);

      expect(result.price).toEqual(79.99);
    });

    it('should throw ProductSkuExistsException if new SKU exists', async () => {
      const updateDto = { sku: 'EXISTING-SKU' };
      const existingVariant = {
        ...mockVariant,
        id: 'other-id',
        sku: 'EXISTING-SKU',
      };

      variantsRepository.findOne
        .mockResolvedValueOnce(mockVariant as ProductVariant) // findOne
        .mockResolvedValueOnce(existingVariant as ProductVariant); // check SKU

      await expect(service.update(mockVariant.id!, updateDto)).rejects.toThrow(
        ProductSkuExistsException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a variant', async () => {
      variantsRepository.findOne.mockResolvedValue(
        mockVariant as ProductVariant,
      );
      variantsRepository.remove.mockResolvedValue(
        mockVariant as ProductVariant,
      );

      await service.remove(mockVariant.id!);

      expect(variantsRepository.remove).toHaveBeenCalledWith(mockVariant);
    });
  });

  describe('updateStock', () => {
    it('should increase stock', async () => {
      variantsRepository.findOne.mockResolvedValue(
        mockVariant as ProductVariant,
      );
      variantsRepository.save.mockResolvedValue({
        ...mockVariant,
        stock: 110,
      } as ProductVariant);

      const result = await service.updateStock(mockVariant.id!, 10);

      expect(result.stock).toEqual(110);
    });

    it('should not allow negative stock', async () => {
      variantsRepository.findOne.mockResolvedValue(
        mockVariant as ProductVariant,
      );
      variantsRepository.save.mockImplementation((v) =>
        Promise.resolve(v as ProductVariant),
      );

      const result = await service.updateStock(mockVariant.id!, -200);

      expect(result.stock).toEqual(0);
    });
  });

  describe('checkAvailability', () => {
    it('should return true if variant is available', async () => {
      const activeVariant = { ...mockVariant, isActive: true, stock: 100 };
      variantsRepository.findOne.mockResolvedValue(
        activeVariant as ProductVariant,
      );

      const result = await service.checkAvailability(mockVariant.id!, 10);

      expect(result).toBe(true);
    });

    it('should return false if stock is insufficient', async () => {
      const activeVariant = { ...mockVariant, isActive: true, stock: 100 };
      variantsRepository.findOne.mockResolvedValue(
        activeVariant as ProductVariant,
      );

      const result = await service.checkAvailability(mockVariant.id!, 150);

      expect(result).toBe(false);
    });

    it('should return false if variant is inactive', async () => {
      variantsRepository.findOne.mockResolvedValue({
        ...mockVariant,
        isActive: false,
        stock: 100,
      } as ProductVariant);

      const result = await service.checkAvailability(mockVariant.id!, 1);

      expect(result).toBe(false);
    });
  });
});
