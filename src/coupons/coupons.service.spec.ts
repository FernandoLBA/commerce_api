import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CouponsService } from './coupons.service';
import { Coupon } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { Order } from '../orders/entities/order.entity';
import { DiscountType } from './enums/discount-type.enum';
import { ValidationException, NotFoundException } from '../common';

describe('CouponsService', () => {
  let service: CouponsService;
  let couponRepository: jest.Mocked<Repository<Coupon>>;
  let usageRepository: jest.Mocked<Repository<CouponUsage>>;
  let orderRepository: jest.Mocked<Repository<Order>>;

  const mockCoupon: Partial<Coupon> = {
    id: 'coupon-1',
    code: 'VERANO20',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 20,
    minPurchaseAmount: 50,
    isActive: true,
    startDate: new Date('2025-01-01'),
    endDate: new Date('2027-12-31'),
    usageLimit: 100,
    usageCount: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: getRepositoryToken(Coupon),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn((data) => data),
            save: jest.fn((data) => Promise.resolve({ id: 'coupon-1', ...data })),
            remove: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CouponUsage),
          useValue: {
            count: jest.fn(),
            create: jest.fn((data) => data),
            save: jest.fn((data) => Promise.resolve({ id: 'usage-1', ...data })),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Order),
          useValue: {
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    couponRepository = module.get(getRepositoryToken(Coupon));
    usageRepository = module.get(getRepositoryToken(CouponUsage));
    orderRepository = module.get(getRepositoryToken(Order));
  });

  describe('create', () => {
    it('should create a coupon', async () => {
      couponRepository.findOne.mockResolvedValue(null);

      const result = await service.create({
        code: 'NUEVO20',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        startDate: new Date(),
        endDate: new Date('2027-12-31'),
      });

      expect(result.code).toBe('NUEVO20');
    });

    it('should throw error if code already exists', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon as Coupon);

      await expect(
        service.create({
          code: 'VERANO20',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 20,
          startDate: new Date(),
          endDate: new Date('2027-12-31'),
        }),
      ).rejects.toThrow(ValidationException);
    });

    it('should throw error for percentage > 100', async () => {
      couponRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          code: 'INVALID',
          discountType: DiscountType.PERCENTAGE,
          discountValue: 150,
          startDate: new Date(),
          endDate: new Date('2027-12-31'),
        }),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe('validateCoupon', () => {
    const cartItems = [
      { productId: 'p1', price: 100, quantity: 1 },
    ];

    it('should validate a valid coupon', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon as Coupon);
      usageRepository.count.mockResolvedValue(0);
      orderRepository.count.mockResolvedValue(0);

      const result = await service.validateCoupon('VERANO20', 'user-1', cartItems, 100);

      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(20); // 20% of 100
    });

    it('should reject inactive coupon', async () => {
      couponRepository.findOne.mockResolvedValue({ ...mockCoupon, isActive: false } as Coupon);

      const result = await service.validateCoupon('VERANO20', 'user-1', cartItems, 100);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Cupón inactivo');
    });

    it('should reject expired coupon', async () => {
      couponRepository.findOne.mockResolvedValue({
        ...mockCoupon,
        endDate: new Date('2020-01-01'),
      } as Coupon);

      const result = await service.validateCoupon('VERANO20', 'user-1', cartItems, 100);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('El cupón ha expirado');
    });

    it('should reject when min purchase not met', async () => {
      couponRepository.findOne.mockResolvedValue({
        ...mockCoupon,
        minPurchaseAmount: 200,
      } as Coupon);

      const result = await service.validateCoupon('VERANO20', 'user-1', cartItems, 100);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('monto mínimo');
    });

    it('should calculate fixed amount discount', async () => {
      couponRepository.findOne.mockResolvedValue({
        ...mockCoupon,
        discountType: DiscountType.FIXED_AMOUNT,
        discountValue: 30,
      } as Coupon);
      usageRepository.count.mockResolvedValue(0);
      orderRepository.count.mockResolvedValue(0);

      const result = await service.validateCoupon('VERANO20', 'user-1', cartItems, 100);

      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(30);
    });

    it('should respect max discount cap', async () => {
      couponRepository.findOne.mockResolvedValue({
        ...mockCoupon,
        discountValue: 50,
        maxDiscountAmount: 15,
      } as Coupon);
      usageRepository.count.mockResolvedValue(0);
      orderRepository.count.mockResolvedValue(0);

      const result = await service.validateCoupon('VERANO20', 'user-1', cartItems, 100);

      expect(result.discountAmount).toBe(15); // Capped at max
    });
  });

  describe('applyCoupon', () => {
    it('should record coupon usage', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon as Coupon);

      await service.applyCoupon('coupon-1', 'user-1', 'order-1', 20);

      expect(usageRepository.save).toHaveBeenCalled();
      expect(couponRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ usageCount: 1 }),
      );
    });
  });
});
