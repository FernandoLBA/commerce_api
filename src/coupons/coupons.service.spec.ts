import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { PrismaService } from '../prisma';
import { DiscountType } from '../generated/prisma/client';

describe('CouponsService', () => {
  let service: CouponsService;
  let prisma: {
    coupon: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    couponUsage: {
      count: jest.Mock;
    };
    order: {
      count: jest.Mock;
    };
  };

  const mockCoupon = {
    id: 'coupon-uuid-123',
    code: 'DISCOUNT10',
    discountType: DiscountType.PERCENTAGE,
    discountValue: 10,
    minPurchaseAmount: 50,
    maxDiscountAmount: 100,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    usageLimit: 100,
    usageCount: 0,
    usageLimitPerUser: 1,
    isActive: true,
    isFirstPurchaseOnly: false,
    applicableProductIds: [],
    applicableCategoryIds: [],
  };

  beforeEach(async () => {
    const mockPrismaService = {
      coupon: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      couponUsage: {
        count: jest.fn(),
      },
      order: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a coupon', async () => {
      prisma.coupon.findFirst.mockResolvedValue(null);
      prisma.coupon.create.mockResolvedValue(mockCoupon);

      const result = await service.create({
        code: 'NEWCOUPON',
        discountType: DiscountType.PERCENTAGE,
        discountValue: 15,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
      });

      expect(prisma.coupon.create).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all active coupons', async () => {
      prisma.coupon.findMany.mockResolvedValue([mockCoupon]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a coupon by id', async () => {
      prisma.coupon.findUnique.mockResolvedValue(mockCoupon);

      const result = await service.findOne(mockCoupon.id);

      expect(result).toEqual(mockCoupon);
    });
  });

  describe('findByCode', () => {
    it('should return a coupon by code', async () => {
      prisma.coupon.findFirst.mockResolvedValue(mockCoupon);

      const result = await service.findByCode('DISCOUNT10');

      expect(result.code).toBe('DISCOUNT10');
    });
  });

  describe('update', () => {
    it('should update a coupon', async () => {
      prisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      prisma.coupon.update.mockResolvedValue({
        ...mockCoupon,
        discountValue: 20,
      });

      const result = await service.update(mockCoupon.id, { discountValue: 20 });

      expect(result.discountValue).toBe(20);
    });
  });

  describe('remove', () => {
    it('should remove a coupon', async () => {
      prisma.coupon.findUnique.mockResolvedValue(mockCoupon);
      prisma.coupon.delete.mockResolvedValue(mockCoupon);

      await service.remove(mockCoupon.id);

      expect(prisma.coupon.delete).toHaveBeenCalledWith({
        where: { id: mockCoupon.id },
      });
    });
  });
});
