import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductNotFoundException, ValidationException } from '../common';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Product } from '../products/entities/product.entity';
import { CartService } from './cart.service';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';

describe('CartService', () => {
  let service: CartService;
  let cartRepository: jest.Mocked<Repository<Cart>>;
  let cartItemRepository: jest.Mocked<Repository<CartItem>>;
  let productRepository: jest.Mocked<Repository<Product>>;

  const userId = 'user-uuid-123';

  const mockProduct: Partial<Product> = {
    id: 'prod-uuid-123',
    name: 'Test Product',
    price: 99.99,
    stock: 100,
    isActive: true,
    hasVariants: false,
  };

  const mockVariant: Partial<ProductVariant> = {
    id: 'variant-uuid-123',
    sku: 'TEST-SKU-001',
    price: 89.99,
    stock: 50,
    isActive: true,
  };

  const mockCart: Partial<Cart> = {
    id: 'cart-uuid-123',
    userId,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCartItem: Partial<CartItem> = {
    id: 'item-uuid-123',
    cartId: mockCart.id,
    productId: mockProduct.id!,
    product: mockProduct as Product,
    variantId: null,
    variant: null,
    quantity: 2,
    unitPrice: 99.99,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockCartRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockCartItemRepository = {
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const mockProductRepository = {
      findOne: jest.fn(),
    };

    const mockVariantRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        { provide: getRepositoryToken(Cart), useValue: mockCartRepository },
        {
          provide: getRepositoryToken(CartItem),
          useValue: mockCartItemRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: mockVariantRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
    cartRepository = module.get(getRepositoryToken(Cart));
    cartItemRepository = module.get(getRepositoryToken(CartItem));
    productRepository = module.get(getRepositoryToken(Product));
    variantRepository = module.get(getRepositoryToken(ProductVariant));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrCreateCart', () => {
    it('should return existing cart', async () => {
      cartRepository.findOne.mockResolvedValue(mockCart as Cart);

      const result = await service.getOrCreateCart(userId);

      expect(result).toEqual(mockCart);
    });

    it('should create new cart if none exists', async () => {
      cartRepository.findOne.mockResolvedValue(null);
      cartRepository.create.mockReturnValue({ ...mockCart, items: [] } as Cart);
      cartRepository.save.mockResolvedValue({ ...mockCart, items: [] } as Cart);

      const result = await service.getOrCreateCart(userId);

      expect(cartRepository.create).toHaveBeenCalledWith({ userId, items: [] });
      expect(cartRepository.save).toHaveBeenCalled();
    });
  });

  describe('getCart', () => {
    it('should return cart with total and item count', async () => {
      const cartWithItems = {
        ...mockCart,
        items: [mockCartItem as CartItem],
      };
      cartRepository.findOne.mockResolvedValue(cartWithItems as Cart);

      const result = await service.getCart(userId);

      expect(result.total).toEqual(199.98); // 2 * 99.99
      expect(result.itemCount).toEqual(2);
    });
  });

  describe('addToCart', () => {
    it('should add product to cart', async () => {
      const addDto = { productId: mockProduct.id!, quantity: 1 };

      cartRepository.findOne.mockResolvedValue({
        ...mockCart,
        items: [],
      } as Cart);
      productRepository.findOne.mockResolvedValue(mockProduct as Product);
      cartItemRepository.create.mockReturnValue(mockCartItem as CartItem);
      cartItemRepository.save.mockResolvedValue(mockCartItem as CartItem);

      const result = await service.addToCart(userId, addDto);

      expect(cartItemRepository.create).toHaveBeenCalled();
      expect(cartItemRepository.save).toHaveBeenCalled();
    });

    it('should throw ProductNotFoundException if product not found', async () => {
      const addDto = { productId: 'nonexistent', quantity: 1 };

      cartRepository.findOne.mockResolvedValue(mockCart as Cart);
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.addToCart(userId, addDto)).rejects.toThrow(
        ProductNotFoundException,
      );
    });

    it('should throw ValidationException if variant required but not provided', async () => {
      const addDto = { productId: mockProduct.id!, quantity: 1 };
      const productWithVariants = { ...mockProduct, hasVariants: true };

      cartRepository.findOne.mockResolvedValue(mockCart as Cart);
      productRepository.findOne.mockResolvedValue(
        productWithVariants as Product,
      );

      await expect(service.addToCart(userId, addDto)).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw ValidationException if insufficient stock', async () => {
      const addDto = { productId: mockProduct.id!, quantity: 150 };
      const lowStockProduct = { ...mockProduct, stock: 10 };

      cartRepository.findOne.mockResolvedValue(mockCart as Cart);
      productRepository.findOne.mockResolvedValue(lowStockProduct as Product);

      await expect(service.addToCart(userId, addDto)).rejects.toThrow(
        ValidationException,
      );
    });

    it('should update quantity if item already in cart', async () => {
      const addDto = { productId: mockProduct.id!, quantity: 1 };
      const existingItem = {
        ...mockCartItem,
        quantity: 2,
        variantId: undefined,
      } as CartItem;
      const cartWithItem = { ...mockCart, items: [existingItem] } as Cart;

      cartRepository.findOne.mockResolvedValue(cartWithItem);
      productRepository.findOne.mockResolvedValue(mockProduct as Product);
      cartItemRepository.save.mockImplementation((item) =>
        Promise.resolve(item as CartItem),
      );

      await service.addToCart(userId, addDto);

      expect(cartItemRepository.save).toHaveBeenCalled();
      const savedItem = cartItemRepository.save.mock.calls[0][0] as CartItem;
      expect(savedItem.quantity).toBe(3);
    });
  });

  describe('updateCartItem', () => {
    it('should update item quantity', async () => {
      const updateDto = { quantity: 5 };
      const cartWithItem = {
        ...mockCart,
        items: [mockCartItem as CartItem],
      } as Cart;

      cartRepository.findOne.mockResolvedValue(cartWithItem);
      cartItemRepository.save.mockResolvedValue({
        ...mockCartItem,
        quantity: 5,
      } as CartItem);

      const result = await service.updateCartItem(
        userId,
        mockCartItem.id!,
        updateDto,
      );

      expect(cartItemRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 5 }),
      );
    });

    it('should throw ValidationException if item not found', async () => {
      const updateDto = { quantity: 5 };
      const emptyCart = { ...mockCart, items: [] } as Cart;

      cartRepository.findOne.mockResolvedValue(emptyCart);

      await expect(
        service.updateCartItem(userId, 'nonexistent', updateDto),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('removeCartItem', () => {
    it('should remove item from cart', async () => {
      const cartWithItem = {
        ...mockCart,
        items: [mockCartItem as CartItem],
      } as Cart;

      cartRepository.findOne.mockResolvedValue(cartWithItem);
      cartItemRepository.remove.mockResolvedValue(mockCartItem as CartItem);

      await service.removeCartItem(userId, mockCartItem.id!);

      expect(cartItemRepository.remove).toHaveBeenCalledWith(mockCartItem);
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', async () => {
      const cartWithItems = {
        ...mockCart,
        items: [mockCartItem as CartItem],
      } as Cart;

      cartRepository.findOne.mockResolvedValue(cartWithItems);
      cartItemRepository.remove.mockResolvedValue([mockCartItem as CartItem]);

      await service.clearCart(userId);

      expect(cartItemRepository.remove).toHaveBeenCalledWith(
        cartWithItems.items,
      );
    });
  });

  describe('validateCartForCheckout', () => {
    it('should return valid true for cart with available items', async () => {
      const cartWithItem = {
        ...mockCart,
        items: [mockCartItem as CartItem],
      } as Cart;

      cartRepository.findOne.mockResolvedValue(cartWithItem);
      productRepository.findOne.mockResolvedValue(mockProduct as Product);

      const result = await service.validateCartForCheckout(userId);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return valid false for empty cart', async () => {
      const emptyCart = { ...mockCart, items: [] } as Cart;

      cartRepository.findOne.mockResolvedValue(emptyCart);

      const result = await service.validateCartForCheckout(userId);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cart is empty');
    });

    it('should return errors for unavailable products', async () => {
      const cartWithItem = {
        ...mockCart,
        items: [mockCartItem as CartItem],
      } as Cart;

      cartRepository.findOne.mockResolvedValue(cartWithItem);
      productRepository.findOne.mockResolvedValue(null);

      const result = await service.validateCartForCheckout(userId);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
