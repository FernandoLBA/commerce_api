import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WishlistService } from './wishlist.service';
import { WishlistItem } from './entities/wishlist-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { ValidationException, NotFoundException } from '../common';

describe('WishlistService', () => {
  let service: WishlistService;
  let wishlistRepository: jest.Mocked<Repository<WishlistItem>>;
  let productRepository: jest.Mocked<Repository<Product>>;
  let variantRepository: jest.Mocked<Repository<ProductVariant>>;

  const mockProduct = {
    id: 'product-1',
    name: 'Test Product',
    price: 100,
    stock: 10,
  };

  const mockWishlistItem = {
    id: 'wishlist-1',
    userId: 'user-1',
    productId: 'product-1',
    priceWhenAdded: 100,
    notifyOnPriceDrop: false,
    notifyOnBackInStock: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: getRepositoryToken(WishlistItem),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn((data) => data),
            save: jest.fn((data) => Promise.resolve({ id: 'wishlist-1', ...data })),
            remove: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WishlistService>(WishlistService);
    wishlistRepository = module.get(getRepositoryToken(WishlistItem));
    productRepository = module.get(getRepositoryToken(Product));
    variantRepository = module.get(getRepositoryToken(ProductVariant));
  });

  describe('addItem', () => {
    it('should add item to wishlist', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct as Product);
      wishlistRepository.findOne.mockResolvedValue(null);

      const result = await service.addItem('user-1', {
        productId: 'product-1',
      });

      expect(result.productId).toBe('product-1');
      expect(result.priceWhenAdded).toBe(100);
    });

    it('should throw error if product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addItem('user-1', { productId: 'nonexistent' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if already in wishlist', async () => {
      productRepository.findOne.mockResolvedValue(mockProduct as Product);
      wishlistRepository.findOne.mockResolvedValue(mockWishlistItem as WishlistItem);

      await expect(
        service.addItem('user-1', { productId: 'product-1' }),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('findAll', () => {
    it('should return user wishlist with current prices', async () => {
      wishlistRepository.find.mockResolvedValue([
        {
          ...mockWishlistItem,
          product: mockProduct,
          variant: null,
        } as any,
      ]);

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].currentPrice).toBe(100);
      expect(result[0].isAvailable).toBe(true);
    });

    it('should calculate price drop', async () => {
      wishlistRepository.find.mockResolvedValue([
        {
          ...mockWishlistItem,
          priceWhenAdded: 150,
          product: { ...mockProduct, price: 100 },
          variant: null,
        } as any,
      ]);

      const result = await service.findAll('user-1');

      expect(result[0].priceDrop).toBe(50);
    });
  });

  describe('remove', () => {
    it('should remove item from wishlist', async () => {
      wishlistRepository.findOne.mockResolvedValue(mockWishlistItem as WishlistItem);

      await service.remove('wishlist-1', 'user-1');

      expect(wishlistRepository.remove).toHaveBeenCalled();
    });

    it('should throw error if item not found', async () => {
      wishlistRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('isInWishlist', () => {
    it('should return true if item exists', async () => {
      wishlistRepository.findOne.mockResolvedValue(mockWishlistItem as WishlistItem);

      const result = await service.isInWishlist('user-1', 'product-1');

      expect(result).toBe(true);
    });

    it('should return false if item does not exist', async () => {
      wishlistRepository.findOne.mockResolvedValue(null);

      const result = await service.isInWishlist('user-1', 'product-1');

      expect(result).toBe(false);
    });
  });

  describe('getWishlistCount', () => {
    it('should return count of items', async () => {
      wishlistRepository.count.mockResolvedValue(5);

      const result = await service.getWishlistCount('user-1');

      expect(result).toBe(5);
    });
  });

  describe('clearWishlist', () => {
    it('should delete all user items', async () => {
      await service.clearWishlist('user-1');

      expect(wishlistRepository.delete).toHaveBeenCalledWith({ userId: 'user-1' });
    });
  });
});
