import { Test, TestingModule } from '@nestjs/testing';
import { WishlistService } from './wishlist.service';
import { PrismaService } from '../prisma';
import { NotFoundException, ValidationException } from '../common';

describe('WishlistService', () => {
  let service: WishlistService;
  let prisma: {
    wishlistItem: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
      count: jest.Mock;
    };
    product: {
      findUnique: jest.Mock;
    };
    productVariant: {
      findFirst: jest.Mock;
    };
  };

  const userId = 'user-uuid-123';
  const productId = 'product-uuid-123';

  const mockProduct = {
    id: productId,
    name: 'Test Product',
    slug: 'test-product',
    price: 99.99,
    stock: 100,
    isActive: true,
  };

  const mockWishlistItem = {
    id: 'wishlist-uuid-123',
    userId,
    productId,
    variantId: null,
    notes: null,
    priceWhenAdded: 99.99,
    notifyOnPriceDrop: true,
    notifyOnBackInStock: false,
    createdAt: new Date(),
    product: mockProduct,
    variant: null,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      wishlistItem: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      product: {
        findUnique: jest.fn(),
      },
      productVariant: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addItem', () => {
    const createDto = {
      productId,
      notifyOnPriceDrop: true,
    };

    it('should add item to wishlist', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.wishlistItem.findFirst.mockResolvedValue(null);
      prisma.wishlistItem.create.mockResolvedValue(mockWishlistItem);

      const result = await service.addItem(userId, createDto);

      expect(prisma.wishlistItem.create).toHaveBeenCalled();
      expect(result.productId).toBe(productId);
    });

    it('should throw NotFoundException if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.addItem(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ValidationException if item already in wishlist', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.wishlistItem.findFirst.mockResolvedValue(mockWishlistItem);

      await expect(service.addItem(userId, createDto)).rejects.toThrow(
        ValidationException,
      );
    });
  });

  describe('findAll', () => {
    it('should return user wishlist', async () => {
      prisma.wishlistItem.findMany.mockResolvedValue([mockWishlistItem]);

      const result = await service.findAll(userId);

      expect(result).toHaveLength(1);
      expect(prisma.wishlistItem.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getWishlistCount', () => {
    it('should return wishlist item count', async () => {
      prisma.wishlistItem.count.mockResolvedValue(5);

      const result = await service.getWishlistCount(userId);

      expect(result).toBe(5);
    });
  });

  describe('isInWishlist', () => {
    it('should return true if item is in wishlist', async () => {
      prisma.wishlistItem.findFirst.mockResolvedValue(mockWishlistItem);

      const result = await service.isInWishlist(userId, productId);

      expect(result).toBe(true);
    });

    it('should return false if item is not in wishlist', async () => {
      prisma.wishlistItem.findFirst.mockResolvedValue(null);

      const result = await service.isInWishlist(userId, productId);

      expect(result).toBe(false);
    });
  });

  describe('update', () => {
    const updateDto = {
      notifyOnPriceDrop: false,
      notes: 'Buy later',
    };

    it('should update wishlist item', async () => {
      prisma.wishlistItem.findFirst.mockResolvedValue(mockWishlistItem);
      prisma.wishlistItem.update.mockResolvedValue({
        ...mockWishlistItem,
        ...updateDto,
      });

      const result = await service.update(
        mockWishlistItem.id,
        userId,
        updateDto,
      );

      expect(result.notifyOnPriceDrop).toBe(false);
      expect(result.notes).toBe('Buy later');
    });

    it('should throw error if item not found', async () => {
      prisma.wishlistItem.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent', userId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove item from wishlist', async () => {
      prisma.wishlistItem.findFirst.mockResolvedValue(mockWishlistItem);
      prisma.wishlistItem.delete.mockResolvedValue(mockWishlistItem);

      await service.remove(mockWishlistItem.id, userId);

      expect(prisma.wishlistItem.delete).toHaveBeenCalledWith({
        where: { id: mockWishlistItem.id },
      });
    });
  });

  describe('clearWishlist', () => {
    it('should clear all wishlist items', async () => {
      prisma.wishlistItem.deleteMany.mockResolvedValue({ count: 3 });

      await service.clearWishlist(userId);

      expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
});
