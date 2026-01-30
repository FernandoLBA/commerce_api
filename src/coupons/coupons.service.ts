import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CouponUsage } from './entities/coupon-usage.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { DiscountType } from './enums/discount-type.enum';
import { NotFoundException, ValidationException } from '../common';

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
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(CouponUsage)
    private usageRepository: Repository<CouponUsage>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    // Check if code already exists
    const existing = await this.couponRepository.findOne({
      where: { code: createCouponDto.code.toUpperCase() },
    });

    if (existing) {
      throw new ValidationException(`Coupon code ${createCouponDto.code} already exists`);
    }

    // Validate percentage discount
    if (
      createCouponDto.discountType === DiscountType.PERCENTAGE &&
      createCouponDto.discountValue > 100
    ) {
      throw new ValidationException('Percentage discount cannot exceed 100%');
    }

    const coupon = this.couponRepository.create({
      ...createCouponDto,
      code: createCouponDto.code.toUpperCase(),
    });

    return this.couponRepository.save(coupon);
  }

  async findAll(includeInactive = false): Promise<Coupon[]> {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.couponRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });

    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }

    return coupon;
  }

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }

    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);

    Object.assign(coupon, updateCouponDto);

    return this.couponRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.remove(coupon);
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
        return { isValid: false, discountAmount: 0, errorMessage: 'Cupón inactivo' };
      }

      // Check dates
      if (now < coupon.startDate) {
        return { isValid: false, discountAmount: 0, errorMessage: 'El cupón aún no está vigente' };
      }

      if (now > coupon.endDate) {
        return { isValid: false, discountAmount: 0, errorMessage: 'El cupón ha expirado' };
      }

      // Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return { isValid: false, discountAmount: 0, errorMessage: 'El cupón ha alcanzado su límite de uso' };
      }

      // Check user usage limit
      if (coupon.usageLimitPerUser) {
        const userUsageCount = await this.usageRepository.count({
          where: { couponId: coupon.id, userId },
        });

        if (userUsageCount >= coupon.usageLimitPerUser) {
          return { isValid: false, discountAmount: 0, errorMessage: 'Ya has usado este cupón el máximo número de veces' };
        }
      }

      // Check first purchase only
      if (coupon.isFirstPurchaseOnly) {
        const previousOrders = await this.orderRepository.count({
          where: { userId },
        });

        if (previousOrders > 0) {
          return { isValid: false, discountAmount: 0, errorMessage: 'Este cupón es solo para primera compra' };
        }
      }

      // Check minimum purchase
      if (coupon.minPurchaseAmount && cartTotal < coupon.minPurchaseAmount) {
        return {
          isValid: false,
          discountAmount: 0,
          errorMessage: `El monto mínimo de compra es S/. ${coupon.minPurchaseAmount}`,
        };
      }

      // Calculate applicable amount (for category/product restrictions)
      const applicableAmount = this.calculateApplicableAmount(coupon, cartItems);

      if (applicableAmount === 0) {
        return { isValid: false, discountAmount: 0, errorMessage: 'El cupón no aplica a los productos del carrito' };
      }

      // Calculate discount
      let discountAmount = this.calculateDiscount(coupon, applicableAmount);

      // Apply max discount cap
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }

      return {
        isValid: true,
        coupon,
        discountAmount: Math.round(discountAmount * 100) / 100,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        return { isValid: false, discountAmount: 0, errorMessage: 'Cupón no encontrado' };
      }
      throw error;
    }
  }

  async applyCoupon(
    couponId: string,
    userId: string,
    orderId: string,
    discountApplied: number,
  ): Promise<CouponUsage> {
    const coupon = await this.findOne(couponId);

    // Record usage
    const usage = this.usageRepository.create({
      couponId,
      userId,
      orderId,
      discountApplied,
    });

    await this.usageRepository.save(usage);

    // Increment usage count
    coupon.usageCount++;
    await this.couponRepository.save(coupon);

    return usage;
  }

  async getCouponUsageHistory(couponId: string): Promise<CouponUsage[]> {
    return this.usageRepository.find({
      where: { couponId },
      relations: ['user', 'order'],
      order: { usedAt: 'DESC' },
    });
  }

  private calculateApplicableAmount(coupon: Coupon, cartItems: CartItem[]): number {
    // If no restrictions, all items apply
    if (
      !coupon.applicableCategories?.length &&
      !coupon.applicableProducts?.length &&
      !coupon.excludedProducts?.length
    ) {
      return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    let applicableAmount = 0;

    for (const item of cartItems) {
      // Check if excluded
      if (coupon.excludedProducts?.includes(item.productId)) {
        continue;
      }

      // Check if specifically included by product
      if (coupon.applicableProducts?.length) {
        if (coupon.applicableProducts.includes(item.productId)) {
          applicableAmount += item.price * item.quantity;
        }
        continue;
      }

      // Check if included by category
      if (coupon.applicableCategories?.length) {
        if (item.categoryId && coupon.applicableCategories.includes(item.categoryId)) {
          applicableAmount += item.price * item.quantity;
        }
        continue;
      }

      // No restrictions, include
      applicableAmount += item.price * item.quantity;
    }

    return applicableAmount;
  }

  private calculateDiscount(coupon: Coupon, applicableAmount: number): number {
    switch (coupon.discountType) {
      case DiscountType.PERCENTAGE:
        return (applicableAmount * coupon.discountValue) / 100;

      case DiscountType.FIXED_AMOUNT:
        return Math.min(coupon.discountValue, applicableAmount);

      case DiscountType.FREE_SHIPPING:
        return 0; // Handled separately in order service

      default:
        return 0;
    }
  }
}
