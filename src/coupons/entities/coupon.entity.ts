import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DiscountType } from '../enums/discount-type.enum';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 50 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'discount_type', type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 2 })
  discountValue: number;

  @Column({ name: 'min_purchase_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minPurchaseAmount?: number;

  @Column({ name: 'max_discount_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscountAmount?: number;

  @Column({ name: 'usage_limit', type: 'int', nullable: true })
  usageLimit?: number;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;

  @Column({ name: 'usage_limit_per_user', type: 'int', nullable: true })
  usageLimitPerUser?: number;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'applicable_categories', type: 'simple-array', nullable: true })
  applicableCategories?: string[];

  @Column({ name: 'applicable_products', type: 'simple-array', nullable: true })
  applicableProducts?: string[];

  @Column({ name: 'excluded_products', type: 'simple-array', nullable: true })
  excludedProducts?: string[];

  @Column({ name: 'is_first_purchase_only', default: false })
  isFirstPurchaseOnly: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
