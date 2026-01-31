import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { PrismaService } from '../prisma';

describe('CartService', () => {
  let service: CartService;
  let prisma: {
    cart: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    cartItem: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    product: {
      findFirst: jest.Mock;
    };
    productVariant: {
      findFirst: jest.Mock;
    };
  };

  const userId = 'user-uuid-123';

  const mockCart = {
    id: 'cart-uuid-123',
    userId,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      cart: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      cartItem: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      product: {
        findFirst: jest.fn(),
      },
      productVariant: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart', async () => {
      prisma.cart.findFirst.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart(userId);

      expect(result.id).toBe(mockCart.id);
    });

    it('should create new cart if none exists', async () => {
      prisma.cart.findFirst.mockResolvedValue(null);
      prisma.cart.create.mockResolvedValue(mockCart);

      const result = await service.getOrCreateCart(userId);

      expect(prisma.cart.create).toHaveBeenCalled();
      expect(result.userId).toBe(userId);
    });
  });

  describe('getCart', () => {
    it('should return cart with items', async () => {
      prisma.cart.findFirst.mockResolvedValue(mockCart);

      const result = await service.getCart(userId);

      expect(result).toBeDefined();
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      prisma.cart.findFirst.mockResolvedValue(mockCart);
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 2 });
      prisma.cart.update.mockResolvedValue(mockCart);

      await service.clearCart(userId);

      expect(prisma.cartItem.deleteMany).toHaveBeenCalled();
    });
  });
});
