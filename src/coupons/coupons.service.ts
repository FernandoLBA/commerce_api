import { Injectable } from '@nestjs/common';
import { Coupon, DiscountType, Prisma } from '@prisma/client';

import { NotFoundException, ValidationException } from '../common';
import { PrismaService } from '../prisma';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

export interface CouponValidation {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  errorMessage?: string;
}

export interface CartItem {
  productId: string;
  categoryId?: string;
  price: number;
  quantity: number;
}

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(createCouponDto: CreateCouponDto) {
    // Check if code already exists
    const existing = await this.prisma.coupon.findFirst({
      where: { code: createCouponDto.code.toUpperCase() },
    });

    if (existing) {
      throw new ValidationException(
        `Coupon code ${createCouponDto.code} already exists`,
      );
    }

    // Validate percentage discount
    if (
      createCouponDto.discountType === DiscountType.PERCENTAGE &&
      createCouponDto.discountValue > 100
    ) {
      throw new ValidationException('Percentage discount cannot exceed 100%');
    }

    return this.prisma.coupon.create({
      data: {
        ...createCouponDto,
        code: createCouponDto.code.toUpperCase(),
      },
    });
  }

  findAll(includeInactive = false) {
    const where: Prisma.CouponWhereInput = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.coupon.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return coupon;
  }

  async findByCode(code: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }

    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    await this.findOne(id);

    return this.prisma.coupon.update({
      where: { id },
      data: updateCouponDto,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.coupon.delete({ where: { id } });
  }

  async validateCoupon(
    code: string,
    userId: string,
    cartItems: CartItem[],
    cartTotal: number,
  ): Promise<CouponValidation> {
    try {
      const coupon = await this.findByCode(code);
      const now = new Date();

      // Check if active
      if (!coupon.isActive) {
        return {
          isValid: false,
          discountAmount: 0,
          errorMessage: 'Cupón inactivo',
        };
      }

      // Check dates
      if (now < coupon.startDate) {
        return {
          isValid: false,
          discountAmount: 0,
          errorMessage: 'El cupón aún no está vigente',
        };
      }

      if (now > coupon.endDate) {
        return {
          isValid: false,
          discountAmount: 0,
          errorMessage: 'El cupón ha expirado',
        };
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return {
          isValid: false,
          discountAmount: 0,
          errorMessage: 'El cupón ha alcanzado su límite de uso',
        };
      }

      // Check user usage limit
      if (coupon.usageLimitPerUser) {
        const userUsageCount = await this.prisma.couponUsage.count({
          where: { couponId: coupon.id, userId },
        });

        if (userUsageCount >= coupon.usageLimitPerUser) {
          return {
            isValid: false,
            discountAmount: 0,
            errorMessage: 'Ya has usado este cupón el máximo número de veces',
          };
        }
      }

      // Check first purchase only
      if (coupon.isFirstPurchaseOnly) {
        const previousOrders = await this.prisma.order.count({
          where: { userId },
        });

        if (previousOrders > 0) {
          return {
            isValid: false,
            discountAmount: 0,
            errorMessage: 'Este cupón es solo para primera compra',
          };
        }
      }

      // Check minimum purchase
      if (
        coupon.minPurchaseAmount &&
        cartTotal < Number(coupon.minPurchaseAmount)
      ) {
        return {
          isValid: false,
          discountAmount: 0,
          errorMessage: `El monto mínimo de compra es S/. ${Number(coupon.minPurchaseAmount)}`,
        };
      }

      // Calculate applicable amount (for category/product restrictions)
      const applicableAmount = this.calculateApplicableAmount(
        coupon,
        cartItems,
      );

      if (applicableAmount === 0) {
        return {
          isValid: false,
          discountAmount: 0,
          errorMessage: 'El cupón no aplica a los productos del carrito',
        };
      }

      // Calculate discount
      let discountAmount = this.calculateDiscount(coupon, applicableAmount);

      // Apply max discount cap
      if (
        coupon.maxDiscountAmount &&
        discountAmount > Number(coupon.maxDiscountAmount)
      ) {
        discountAmount = Number(coupon.maxDiscountAmount);
      }

      return {
        isValid: true,
        coupon,
        discountAmount: Math.round(discountAmount * 100) / 100,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          isValid: false,
          discountAmount: 0,
          errorMessage: 'Cupón no encontrado',
        };
      }
      throw error;
    }
  }

  async applyCoupon(
    couponId: string,
    userId: string,
    orderId: string,
    discountApplied: number,
  ) {
    await this.findOne(couponId);

    // Record usage
    const usage = await this.prisma.couponUsage.create({
      data: {
        couponId,
        userId,
        orderId,
        discountApplied,
      },
    });

    // Increment usage count
    await this.prisma.coupon.update({
      where: { id: couponId },
      data: { usageCount: { increment: 1 } },
    });

    return usage;
  }

  getCouponUsageHistory(couponId: string) {
    return this.prisma.couponUsage.findMany({
      where: { couponId },
      include: { user: true, order: true },
      orderBy: { usedAt: 'desc' },
    });
  }

  private calculateApplicableAmount(
    coupon: any,
    cartItems: CartItem[],
  ): number {
    // If no restrictions, all items apply
    if (
      !(coupon.applicableCategories as string[])?.length &&
      !(coupon.applicableProducts as string[])?.length &&
      !(coupon.excludedProducts as string[])?.length
    ) {
      return cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
    }

    let applicableAmount = 0;
    const applicableCategories =
      (coupon.applicableCategories as string[]) || [];
    const applicableProducts = (coupon.applicableProducts as string[]) || [];
    const excludedProducts = (coupon.excludedProducts as string[]) || [];

    for (const item of cartItems) {
      // Check if excluded
      if (excludedProducts.includes(item.productId)) {
        continue;
      }

      // Check if specifically included by product
      if (applicableProducts.length) {
        if (applicableProducts.includes(item.productId)) {
          applicableAmount += item.price * item.quantity;
        }
        continue;
      }

      // Check if included by category
      if (applicableCategories.length) {
        if (item.categoryId && applicableCategories.includes(item.categoryId)) {
          applicableAmount += item.price * item.quantity;
        }
        continue;
      }

      // No restrictions, include
      applicableAmount += item.price * item.quantity;
    }

    return applicableAmount;
  }

  private calculateDiscount(coupon: any, applicableAmount: number): number {
    switch (coupon.discountType) {
      case DiscountType.PERCENTAGE:
        return (applicableAmount * Number(coupon.discountValue)) / 100;

      case DiscountType.FIXED_AMOUNT:
        return Math.min(Number(coupon.discountValue), applicableAmount);

      case DiscountType.FREE_SHIPPING:
        return 0; // Handled separately in order service

      default:
        return 0;
    }
  }
}
