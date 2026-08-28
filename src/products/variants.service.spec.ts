import { Test, TestingModule } from '@nestjs/testing';
import { VariantsService } from './variants.service';
import { PrismaService } from '../prisma';
import { AttributesService } from './attributes.service';
import {
  ProductNotFoundException,
  ProductSkuExistsException,
  ProductVariantNotFoundException,
} from '../common';

describe('VariantsService', () => {
  let service: VariantsService;
  let prisma: {
    product: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    productVariant: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let attributesService: {
    findAttributeValuesByIds: jest.Mock;
  };

  const mockProduct = {
    id: 'product-uuid-123',
    name: 'Test Product',
    slug: 'test-product',
    hasVariants: false,
  };

  const mockAttributeValues = [
    { id: 'attr-val-1', value: 'M', attribute: { id: 'attr-1', name: 'Size' } },
    {
      id: 'attr-val-2',
      value: 'Red',
      attribute: { id: 'attr-2', name: 'Color' },
    },
  ];

  const mockVariant = {
    id: 'variant-uuid-123',
    sku: 'POLO-BAS-M-ROJO',
    price: 49.99,
    compareAtPrice: 59.99,
    stock: 100,
    isActive: true,
    productId: 'product-uuid-123',
    product: mockProduct,
    attributeValues: mockAttributeValues.map((av) => ({
      attributeValueId: av.id,
      attributeValue: av,
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      product: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      productVariant: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const mockAttributesService = {
      findAttributeValuesByIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VariantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AttributesService,
          useValue: mockAttributesService,
        },
      ],
    }).compile();

    service = module.get<VariantsService>(VariantsService);
    prisma = module.get(PrismaService);
    attributesService = module.get(AttributesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createVariantDto = {
      productId: 'product-uuid-123',
      sku: 'POLO-BAS-M-ROJO',
      price: 49.99,
      stock: 100,
      attributeValueIds: ['attr-val-1', 'attr-val-2'],
    };

    it('should create a variant successfully', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.productVariant.findFirst.mockResolvedValue(null);
      attributesService.findAttributeValuesByIds.mockResolvedValue(
        mockAttributeValues,
      );
      prisma.productVariant.create.mockResolvedValue(mockVariant);
      prisma.product.update.mockResolvedValue({
        ...mockProduct,
        hasVariants: true,
      });

      const result = await service.create(createVariantDto);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: createVariantDto.productId },
      });
      expect(prisma.productVariant.findFirst).toHaveBeenCalledWith({
        where: { sku: createVariantDto.sku },
      });
      expect(attributesService.findAttributeValuesByIds).toHaveBeenCalledWith(
        createVariantDto.attributeValueIds,
      );
      expect(prisma.productVariant.create).toHaveBeenCalled();
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: createVariantDto.productId },
        data: { hasVariants: true },
      });
      expect(result.sku).toBe('POLO-BAS-M-ROJO');
    });

    it('should throw ProductNotFoundException when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.create(createVariantDto)).rejects.toThrow(
        ProductNotFoundException,
      );
    });

    it('should throw ProductSkuExistsException when SKU already exists', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.productVariant.findFirst.mockResolvedValue(mockVariant);

      await expect(service.create(createVariantDto)).rejects.toThrow(
        ProductSkuExistsException,
      );
    });

    it('should not update product hasVariants if already true', async () => {
      const productWithVariants = { ...mockProduct, hasVariants: true };
      prisma.product.findUnique.mockResolvedValue(productWithVariants);
      prisma.productVariant.findFirst.mockResolvedValue(null);
      attributesService.findAttributeValuesByIds.mockResolvedValue(
        mockAttributeValues,
      );
      prisma.productVariant.create.mockResolvedValue(mockVariant);

      await service.create(createVariantDto);

      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('findAllByProduct', () => {
    it('should return all variants for a product', async () => {
      prisma.productVariant.findMany.mockResolvedValue([mockVariant]);

      const result = await service.findAllByProduct('product-uuid-123');

      expect(prisma.productVariant.findMany).toHaveBeenCalledWith({
        where: { productId: 'product-uuid-123' },
        include: {
          attributeValues: {
            include: { attributeValue: { include: { attribute: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].sku).toBe('POLO-BAS-M-ROJO');
    });
  });

  describe('findOne', () => {
    it('should return a variant by id', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);

      const result = await service.findOne('variant-uuid-123');

      expect(prisma.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: 'variant-uuid-123' },
        include: {
          product: true,
          attributeValues: {
            include: { attributeValue: { include: { attribute: true } } },
          },
        },
      });
      expect(result.sku).toBe('POLO-BAS-M-ROJO');
    });

    it('should throw ProductVariantNotFoundException when variant does not exist', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        ProductVariantNotFoundException,
      );
    });
  });

  describe('findBySku', () => {
    it('should return a variant by SKU', async () => {
      prisma.productVariant.findFirst.mockResolvedValue(mockVariant);

      const result = await service.findBySku('POLO-BAS-M-ROJO');

      expect(prisma.productVariant.findFirst).toHaveBeenCalledWith({
        where: { sku: 'POLO-BAS-M-ROJO' },
        include: {
          product: true,
          attributeValues: {
            include: { attributeValue: { include: { attribute: true } } },
          },
        },
      });
      expect(result.id).toBe('variant-uuid-123');
    });

    it('should throw ProductVariantNotFoundException when variant with SKU does not exist', async () => {
      prisma.productVariant.findFirst.mockResolvedValue(null);

      await expect(service.findBySku('NON-EXISTENT-SKU')).rejects.toThrow(
        ProductVariantNotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateVariantDto = {
      price: 54.99,
      stock: 150,
    };

    it('should update a variant', async () => {
      const updatedVariant = { ...mockVariant, ...updateVariantDto };
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      prisma.productVariant.update.mockResolvedValue(updatedVariant);

      const result = await service.update('variant-uuid-123', updateVariantDto);

      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'variant-uuid-123' },
        data: updateVariantDto,
        include: {
          attributeValues: {
            include: { attributeValue: { include: { attribute: true } } },
          },
        },
      });
      expect(result.price).toBe(54.99);
      expect(result.stock).toBe(150);
    });

    it('should throw ProductSkuExistsException when updating to existing SKU', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      prisma.productVariant.findFirst.mockResolvedValue({
        ...mockVariant,
        id: 'other-variant',
        sku: 'EXISTING-SKU',
      });

      await expect(
        service.update('variant-uuid-123', { sku: 'EXISTING-SKU' }),
      ).rejects.toThrow(ProductSkuExistsException);
    });

    it('should update attribute values when provided', async () => {
      const newAttributeValues = [
        {
          id: 'attr-val-3',
          value: 'L',
          attribute: { id: 'attr-1', name: 'Size' },
        },
      ];
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      attributesService.findAttributeValuesByIds.mockResolvedValue(
        newAttributeValues,
      );
      prisma.productVariant.update.mockResolvedValue({
        ...mockVariant,
        attributeValues: newAttributeValues.map((av) => ({
          attributeValueId: av.id,
          attributeValue: av,
        })),
      });

      await service.update('variant-uuid-123', {
        attributeValueIds: ['attr-val-3'],
      });

      expect(attributesService.findAttributeValuesByIds).toHaveBeenCalledWith([
        'attr-val-3',
      ]);

      const updateCall = prisma.productVariant.update.mock.calls[0][0] as {
        where: { id: string };
        data: {
          attributeValues?: {
            deleteMany: Record<string, unknown>;
            create: Array<{ attributeValueId: string }>;
          };
        };
      };
      expect(updateCall.data.attributeValues).toEqual({
        deleteMany: {},
        create: [{ attributeValueId: 'attr-val-3' }],
      });
    });
  });

  describe('remove', () => {
    it('should remove a variant', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      prisma.productVariant.delete.mockResolvedValue(mockVariant);

      await service.remove('variant-uuid-123');

      expect(prisma.productVariant.delete).toHaveBeenCalledWith({
        where: { id: 'variant-uuid-123' },
      });
    });

    it('should throw ProductVariantNotFoundException when variant does not exist', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        ProductVariantNotFoundException,
      );
    });
  });

  describe('updateStock', () => {
    it('should increase stock', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      prisma.productVariant.update.mockResolvedValue({
        ...mockVariant,
        stock: 150,
      });

      const result = await service.updateStock('variant-uuid-123', 50);

      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'variant-uuid-123' },
        data: { stock: 150 },
      });
      expect(result.stock).toBe(150);
    });

    it('should decrease stock', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      prisma.productVariant.update.mockResolvedValue({
        ...mockVariant,
        stock: 50,
      });

      const result = await service.updateStock('variant-uuid-123', -50);

      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'variant-uuid-123' },
        data: { stock: 50 },
      });
      expect(result.stock).toBe(50);
    });

    it('should not allow stock to go below zero', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      prisma.productVariant.update.mockResolvedValue({
        ...mockVariant,
        stock: 0,
      });

      await service.updateStock('variant-uuid-123', -200);

      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'variant-uuid-123' },
        data: { stock: 0 },
      });
    });
  });

  describe('checkAvailability', () => {
    it('should return true when variant is active and has enough stock', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);

      const result = await service.checkAvailability('variant-uuid-123', 50);

      expect(result).toBe(true);
    });

    it('should return false when variant is inactive', async () => {
      prisma.productVariant.findUnique.mockResolvedValue({
        ...mockVariant,
        isActive: false,
      });

      const result = await service.checkAvailability('variant-uuid-123', 50);

      expect(result).toBe(false);
    });

    it('should return false when stock is insufficient', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);

      const result = await service.checkAvailability('variant-uuid-123', 150);

      expect(result).toBe(false);
    });

    it('should throw ProductVariantNotFoundException when variant does not exist', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(null);

      await expect(
        service.checkAvailability('non-existent-id', 10),
      ).rejects.toThrow(ProductVariantNotFoundException);
    });
  });
});
