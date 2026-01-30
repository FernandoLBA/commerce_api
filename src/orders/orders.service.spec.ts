import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { CartService } from '../cart/cart.service';
import { AddressNotFoundException, ValidationException } from '../common';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Product } from '../products/entities/product.entity';
import { Address } from '../users/entities/address.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { Payment } from './entities/payment.entity';
import { OrderStatus } from './enums/order-status.enum';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let orderItemRepository: jest.Mocked<Repository<OrderItem>>;
  let paymentRepository: jest.Mocked<Repository<Payment>>;
  let addressRepository: jest.Mocked<Repository<Address>>;
  let variantRepository: jest.Mocked<Repository<ProductVariant>>;
  let productRepository: jest.Mocked<Repository<Product>>;
  let cartService: jest.Mocked<CartService>;
  let queryRunner: jest.Mocked<QueryRunner>;

  const userId = 'user-uuid-123';

  const mockAddress: Partial<Address> = {
    id: 'address-uuid-123',
    userId,
    recipientName: 'John Doe',
    recipientPhone: '+51999888777',
    street: 'Av. Javier Prado',
    number: '123',
    apartment: '501',
    district: 'San Isidro',
    city: 'Lima',
    department: 'Lima',
    postalCode: '15036',
    reference: 'Frente al parque',
  };

  const mockCart = {
    id: 'cart-uuid-123',
    userId,
    items: [
      {
        id: 'item-uuid-1',
        productId: 'prod-uuid-1',
        product: {
          id: 'prod-uuid-1',
          name: 'Test Product',
          slug: 'test-product',
          images: [{ url: 'https://example.com/img.jpg' }],
        },
        variantId: null,
        variant: null,
        quantity: 2,
        unitPrice: 50,
      },
    ],
    total: 100,
    itemCount: 2,
  };

  const mockOrder: Partial<Order> = {
    id: 'order-uuid-123',
    orderNumber: 'ORD20250100001',
    userId,
    status: OrderStatus.PENDING,
    shippingAddress: {
      recipientName: 'John Doe',
      recipientPhone: '+51999888777',
      street: 'Av. Javier Prado',
      number: '123',
      apartment: '501',
      district: 'San Isidro',
      city: 'Lima',
      department: 'Lima',
      postalCode: '15036',
      reference: 'Frente al parque',
    },
    subtotal: 100,
    shippingCost: 10,
    discount: 0,
    total: 110,
    items: [],
    payments: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayment: Partial<Payment> = {
    id: 'payment-uuid-123',
    orderId: mockOrder.id,
    method: PaymentMethod.STRIPE,
    status: PaymentStatus.PENDING,
    amount: 110,
    currency: 'PEN',
  };

  beforeEach(async () => {
    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
        decrement: jest.fn(),
      },
    } as any;

    const mockOrderRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const mockOrderItemRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockPaymentRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    const mockAddressRepository = {
      findOne: jest.fn(),
    };

    const mockVariantRepository = {
      increment: jest.fn(),
    };

    const mockProductRepository = {
      increment: jest.fn(),
    };

    const mockCartService = {
      validateCartForCheckout: jest.fn(),
      getCart: jest.fn(),
      clearCart: jest.fn(),
    };

    const mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        {
          provide: getRepositoryToken(OrderItem),
          useValue: mockOrderItemRepository,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: mockPaymentRepository,
        },
        {
          provide: getRepositoryToken(Address),
          useValue: mockAddressRepository,
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: mockVariantRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: mockProductRepository,
        },
        { provide: CartService, useValue: mockCartService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get(getRepositoryToken(Order));
    orderItemRepository = module.get(getRepositoryToken(OrderItem));
    paymentRepository = module.get(getRepositoryToken(Payment));
    addressRepository = module.get(getRepositoryToken(Address));
    variantRepository = module.get(getRepositoryToken(ProductVariant));
    productRepository = module.get(getRepositoryToken(Product));
    cartService = module.get(CartService);
    dataSource = module.get(DataSource);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createOrderDto = {
      shippingAddressId: 'address-uuid-123',
      paymentMethod: PaymentMethod.STRIPE,
      notes: 'Test order',
    };

    it('should create an order successfully', async () => {
      cartService.validateCartForCheckout.mockResolvedValue({
        valid: true,
        errors: [],
      });
      cartService.getCart.mockResolvedValue(mockCart as any);
      addressRepository.findOne.mockResolvedValue(mockAddress as Address);
      orderRepository.create.mockReturnValue(mockOrder as Order);
      orderItemRepository.create.mockReturnValue({} as OrderItem);
      paymentRepository.create.mockReturnValue(mockPayment as Payment);
      orderRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      } as any);
      orderRepository.findOne.mockResolvedValue({
        ...mockOrder,
        items: [],
        payments: [mockPayment],
      } as Order);

      const result = await service.create(userId, createOrderDto);

      expect(cartService.validateCartForCheckout).toHaveBeenCalledWith(userId);
      expect(cartService.getCart).toHaveBeenCalledWith(userId);
      expect(addressRepository.findOne).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(cartService.clearCart).toHaveBeenCalledWith(userId);
      expect(result).toBeDefined();
    });

    it('should throw ValidationException if cart is invalid', async () => {
      cartService.validateCartForCheckout.mockResolvedValue({
        valid: false,
        errors: ['Product out of stock'],
      });

      await expect(service.create(userId, createOrderDto)).rejects.toThrow(
        ValidationException,
      );
    });

    it('should throw AddressNotFoundException if address not found', async () => {
      cartService.validateCartForCheckout.mockResolvedValue({
        valid: true,
        errors: [],
      });
      cartService.getCart.mockResolvedValue(mockCart as any);
      addressRepository.findOne.mockResolvedValue(null);

      await expect(service.create(userId, createOrderDto)).rejects.toThrow(
        AddressNotFoundException,
      );
    });

    it('should rollback transaction on error', async () => {
      cartService.validateCartForCheckout.mockResolvedValue({
        valid: true,
        errors: [],
      });
      cartService.getCart.mockResolvedValue(mockCart as any);
      addressRepository.findOne.mockResolvedValue(mockAddress as Address);
      orderRepository.create.mockReturnValue(mockOrder as Order);
      orderRepository.createQueryBuilder.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      } as any);
      queryRunner.manager.save.mockRejectedValueOnce(new Error('DB Error'));

      await expect(service.create(userId, createOrderDto)).rejects.toThrow(
        'DB Error',
      );
      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all orders for admin', async () => {
      const orders = [mockOrder as Order];
      orderRepository.find.mockResolvedValue(orders);

      const result = await service.findAll(undefined, true);

      expect(orderRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['items', 'payments'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(orders);
    });

    it('should return user orders for non-admin', async () => {
      const orders = [mockOrder as Order];
      orderRepository.find.mockResolvedValue(orders);

      const result = await service.findAll(userId, false);

      expect(orderRepository.find).toHaveBeenCalledWith({
        where: { userId },
        relations: ['items', 'payments'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(orders);
    });
  });

  describe('findOne', () => {
    it('should return order by id', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder as Order);

      const result = await service.findOne(mockOrder.id!);

      expect(result).toEqual(mockOrder);
    });

    it('should return order by id and userId', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder as Order);

      const result = await service.findOne(mockOrder.id!, userId);

      expect(orderRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockOrder.id, userId },
        relations: ['items', 'payments', 'user'],
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw ValidationException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        ValidationException,
      );
    });
  });

  describe('findByOrderNumber', () => {
    it('should return order by order number', async () => {
      orderRepository.findOne.mockResolvedValue(mockOrder as Order);

      const result = await service.findByOrderNumber(mockOrder.orderNumber!);

      expect(result).toEqual(mockOrder);
    });

    it('should throw ValidationException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);

      await expect(service.findByOrderNumber('INVALID123')).rejects.toThrow(
        ValidationException,
      );
    });
  });

  describe('update', () => {
    it('should update order status', async () => {
      const pendingOrder = {
        ...mockOrder,
        status: OrderStatus.PENDING,
      } as Order;
      orderRepository.findOne
        .mockResolvedValueOnce(pendingOrder)
        .mockResolvedValueOnce({
          ...pendingOrder,
          status: OrderStatus.CONFIRMED,
        } as Order);
      orderRepository.save.mockResolvedValue({
        ...pendingOrder,
        status: OrderStatus.CONFIRMED,
      } as Order);

      const result = await service.update(mockOrder.id!, {
        status: OrderStatus.CONFIRMED,
      });

      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should throw ValidationException for invalid status transition', async () => {
      const deliveredOrder = {
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      } as Order;
      orderRepository.findOne.mockResolvedValue(deliveredOrder);

      await expect(
        service.update(mockOrder.id!, { status: OrderStatus.PENDING }),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('cancel', () => {
    it('should cancel pending order and restore stock', async () => {
      const orderWithItems = {
        ...mockOrder,
        status: OrderStatus.PENDING,
        items: [
          { id: 'item-1', productId: 'prod-1', variantId: null, quantity: 2 },
        ],
        payments: [{ ...mockPayment, status: PaymentStatus.PENDING }],
      } as Order;

      orderRepository.findOne
        .mockResolvedValueOnce(orderWithItems)
        .mockResolvedValueOnce({
          ...orderWithItems,
          status: OrderStatus.CANCELLED,
        } as Order);
      orderRepository.save.mockResolvedValue({
        ...orderWithItems,
        status: OrderStatus.CANCELLED,
      } as Order);

      const result = await service.cancel(mockOrder.id!, userId);

      expect(productRepository.increment).toHaveBeenCalledWith(
        { id: 'prod-1' },
        'stock',
        2,
      );
      expect(result.status).toBe(OrderStatus.CANCELLED);
    });

    it('should restore variant stock when cancelling', async () => {
      const orderWithVariant = {
        ...mockOrder,
        status: OrderStatus.PENDING,
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            variantId: 'variant-1',
            quantity: 3,
          },
        ],
        payments: [],
      } as Order;

      orderRepository.findOne
        .mockResolvedValueOnce(orderWithVariant)
        .mockResolvedValueOnce({
          ...orderWithVariant,
          status: OrderStatus.CANCELLED,
        } as Order);
      orderRepository.save.mockResolvedValue({
        ...orderWithVariant,
        status: OrderStatus.CANCELLED,
      } as Order);

      await service.cancel(mockOrder.id!);

      expect(variantRepository.increment).toHaveBeenCalledWith(
        { id: 'variant-1' },
        'stock',
        3,
      );
    });

    it('should throw ValidationException if order cannot be cancelled', async () => {
      const shippedOrder = {
        ...mockOrder,
        status: OrderStatus.SHIPPED,
      } as Order;
      orderRepository.findOne.mockResolvedValue(shippedOrder);

      await expect(service.cancel(mockOrder.id!)).rejects.toThrow(
        ValidationException,
      );
    });
  });

  describe('status transitions', () => {
    const testCases = [
      { from: OrderStatus.PENDING, to: OrderStatus.CONFIRMED, valid: true },
      { from: OrderStatus.PENDING, to: OrderStatus.CANCELLED, valid: true },
      { from: OrderStatus.PENDING, to: OrderStatus.SHIPPED, valid: false },
      { from: OrderStatus.CONFIRMED, to: OrderStatus.PROCESSING, valid: true },
      { from: OrderStatus.CONFIRMED, to: OrderStatus.CANCELLED, valid: true },
      { from: OrderStatus.PROCESSING, to: OrderStatus.SHIPPED, valid: true },
      { from: OrderStatus.SHIPPED, to: OrderStatus.DELIVERED, valid: true },
      { from: OrderStatus.SHIPPED, to: OrderStatus.CANCELLED, valid: false },
      { from: OrderStatus.DELIVERED, to: OrderStatus.REFUNDED, valid: true },
      { from: OrderStatus.CANCELLED, to: OrderStatus.PENDING, valid: false },
    ];

    testCases.forEach(({ from, to, valid }) => {
      it(`should ${valid ? 'allow' : 'reject'} transition from ${from} to ${to}`, async () => {
        const order = { ...mockOrder, status: from } as Order;
        orderRepository.findOne
          .mockResolvedValueOnce(order)
          .mockResolvedValueOnce({ ...order, status: to } as Order);
        orderRepository.save.mockResolvedValue({
          ...order,
          status: to,
        } as Order);

        if (valid) {
          const result = await service.update(mockOrder.id!, { status: to });
          expect(result.status).toBe(to);
        } else {
          await expect(
            service.update(mockOrder.id!, { status: to }),
          ).rejects.toThrow(ValidationException);
        }
      });
    });
  });
});
