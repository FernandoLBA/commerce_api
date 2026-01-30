import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryService } from './inventory.service';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { StockAlert } from './entities/stock-alert.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { MovementType } from './enums/movement-type.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { ValidationException, NotFoundException } from '../common';

describe('InventoryService', () => {
  let service: InventoryService;
  let productRepository: jest.Mocked<Repository<Product>>;
  let variantRepository: jest.Mocked<Repository<ProductVariant>>;
  let movementRepository: jest.Mocked<Repository<InventoryMovement>>;
  let alertRepository: jest.Mocked<Repository<StockAlert>>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const mockProduct = {
    id: 'product-1',
    name: 'Test Product',
    stock: 100,
  };

  const mockVariant = {
    id: 'variant-1',
    sku: 'SKU-001',
    stock: 50,
    productId: 'product-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProductVariant),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(InventoryMovement),
          useValue: {
            create: jest.fn((data) => data),
            save: jest.fn((data) => Promise.resolve({ id: 'movement-1', ...data })),
            find: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockAlert),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn((data) => data),
            save: jest.fn((data) => Promise.resolve({ id: 'alert-1', ...data })),
            find: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            sendLowStockAlert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    productRepository = module.get(getRepositoryToken(Product));
    variantRepository = module.get(getRepositoryToken(ProductVariant));
    movementRepository = module.get(getRepositoryToken(InventoryMovement));
    alertRepository = module.get(getRepositoryToken(StockAlert));
    notificationsService = module.get(NotificationsService);
  });

  describe('adjustStock', () => {
    it('should increase product stock on purchase', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct } as Product);
      productRepository.save.mockResolvedValue({ ...mockProduct, stock: 120 } as Product);
      alertRepository.findOne.mockResolvedValue(null);

      const result = await service.adjustStock({
        productId: 'product-1',
        type: MovementType.PURCHASE,
        quantity: 20,
      });

      expect(result.quantity).toBe(20);
      expect(result.previousStock).toBe(100);
      expect(result.newStock).toBe(120);
      expect(productRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ stock: 120 }),
      );
    });

    it('should decrease product stock on sale', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct } as Product);
      productRepository.save.mockResolvedValue({ ...mockProduct, stock: 90 } as Product);
      alertRepository.findOne.mockResolvedValue(null);

      const result = await service.adjustStock({
        productId: 'product-1',
        type: MovementType.SALE,
        quantity: 10,
      });

      expect(result.quantity).toBe(-10);
      expect(result.previousStock).toBe(100);
      expect(result.newStock).toBe(90);
    });

    it('should throw error on insufficient stock', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct, stock: 5 } as Product);

      await expect(
        service.adjustStock({
          productId: 'product-1',
          type: MovementType.SALE,
          quantity: 10,
        }),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw error when product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      await expect(
        service.adjustStock({
          productId: 'nonexistent',
          type: MovementType.PURCHASE,
          quantity: 10,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should adjust variant stock', async () => {
      variantRepository.findOne.mockResolvedValue({ ...mockVariant } as ProductVariant);
      variantRepository.save.mockResolvedValue({ ...mockVariant, stock: 60 } as ProductVariant);
      alertRepository.findOne.mockResolvedValue(null);

      const result = await service.adjustStock({
        variantId: 'variant-1',
        type: MovementType.PURCHASE,
        quantity: 10,
      });

      expect(result.quantity).toBe(10);
      expect(result.previousStock).toBe(50);
      expect(result.newStock).toBe(60);
    });

    it('should require either productId or variantId', async () => {
      await expect(
        service.adjustStock({
          type: MovementType.PURCHASE,
          quantity: 10,
        }),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('reserveStock', () => {
    it('should reserve stock for order items', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct } as Product);
      productRepository.save.mockResolvedValue({ ...mockProduct, stock: 95 } as Product);
      alertRepository.findOne.mockResolvedValue(null);

      const reservations = [
        { productId: 'product-1', quantity: 5 },
      ];

      const result = await service.reserveStock(reservations, 'order-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(MovementType.RESERVATION);
      expect(result[0].orderId).toBe('order-1');
    });
  });

  describe('releaseStock', () => {
    it('should release reserved stock when order cancelled', async () => {
      const mockReservation = {
        id: 'movement-1',
        productId: 'product-1',
        variantId: null,
        type: MovementType.RESERVATION,
        quantity: -5,
        orderId: 'order-1',
      };

      movementRepository.find.mockResolvedValue([mockReservation as InventoryMovement]);
      productRepository.findOne.mockResolvedValue({ ...mockProduct, stock: 95 } as Product);
      productRepository.save.mockResolvedValue({ ...mockProduct, stock: 100 } as Product);
      alertRepository.findOne.mockResolvedValue(null);

      const result = await service.releaseStock('order-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(MovementType.RELEASE);
    });
  });

  describe('getStockLevel', () => {
    it('should return product stock level', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct } as Product);

      const stock = await service.getStockLevel('product-1');

      expect(stock).toBe(100);
    });

    it('should return variant stock level', async () => {
      variantRepository.findOne.mockResolvedValue({ ...mockVariant } as ProductVariant);

      const stock = await service.getStockLevel(undefined, 'variant-1');

      expect(stock).toBe(50);
    });
  });

  describe('setAlertThreshold', () => {
    it('should create new alert threshold', async () => {
      alertRepository.findOne.mockResolvedValue(null);

      const result = await service.setAlertThreshold({
        productId: 'product-1',
        lowStockThreshold: 10,
        criticalStockThreshold: 2,
      });

      expect(alertRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'product-1',
          lowStockThreshold: 10,
          criticalStockThreshold: 2,
        }),
      );
    });

    it('should update existing alert threshold', async () => {
      const existingAlert = {
        id: 'alert-1',
        productId: 'product-1',
        lowStockThreshold: 5,
        criticalStockThreshold: 0,
      };
      alertRepository.findOne.mockResolvedValue(existingAlert as StockAlert);

      await service.setAlertThreshold({
        productId: 'product-1',
        lowStockThreshold: 15,
      });

      expect(alertRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          lowStockThreshold: 15,
        }),
      );
    });
  });

  describe('checkStockAvailability', () => {
    it('should return available true when stock is sufficient', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct } as Product);

      const result = await service.checkStockAvailability([
        { productId: 'product-1', quantity: 10 },
      ]);

      expect(result.available).toBe(true);
      expect(result.unavailableItems).toHaveLength(0);
    });

    it('should return unavailable items when stock is insufficient', async () => {
      productRepository.findOne.mockResolvedValue({ ...mockProduct, stock: 5 } as Product);

      const result = await service.checkStockAvailability([
        { productId: 'product-1', quantity: 10 },
      ]);

      expect(result.available).toBe(false);
      expect(result.unavailableItems).toContain('product-1');
    });
  });

  describe('getLowStockItems', () => {
    it('should return products below threshold', async () => {
      const mockAlert = {
        id: 'alert-1',
        productId: 'product-1',
        lowStockThreshold: 20,
        criticalStockThreshold: 5,
        alertEnabled: true,
        product: { ...mockProduct, stock: 10 },
      };

      alertRepository.find
        .mockResolvedValueOnce([mockAlert as any]) // product alerts
        .mockResolvedValueOnce([]); // variant alerts

      const result = await service.getLowStockItems();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Product');
      expect(result[0].currentStock).toBe(10);
      expect(result[0].isCritical).toBe(false);
    });

    it('should mark critical items', async () => {
      const mockAlert = {
        id: 'alert-1',
        productId: 'product-1',
        lowStockThreshold: 20,
        criticalStockThreshold: 10,
        alertEnabled: true,
        product: { ...mockProduct, stock: 5 },
      };

      alertRepository.find
        .mockResolvedValueOnce([mockAlert as any])
        .mockResolvedValueOnce([]);

      const result = await service.getLowStockItems();

      expect(result[0].isCritical).toBe(true);
    });
  });

  describe('getMovementHistory', () => {
    it('should return paginated movement history', async () => {
      const mockMovements = [
        { id: 'movement-1', type: MovementType.PURCHASE, quantity: 10 },
        { id: 'movement-2', type: MovementType.SALE, quantity: -5 },
      ];

      movementRepository.findAndCount.mockResolvedValue([mockMovements as any, 2]);

      const result = await service.getMovementHistory('product-1', undefined, 1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});
