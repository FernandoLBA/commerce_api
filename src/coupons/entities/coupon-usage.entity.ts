import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Coupon } from './coupon.entity';
import { User } from '../../auth/entities/user.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('coupon_usages')
@Index(['couponId', 'userId'])
export class CouponUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coupon_id' })
  couponId: string;

  @ManyToOne(() => Coupon, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'order_id', nullable: true })
  orderId?: string;

  @ManyToOne(() => Order, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order?: Order;

  @Column({ name: 'discount_applied', type: 'decimal', precision: 10, scale: 2 })
  discountApplied: number;

  @CreateDateColumn({ name: 'used_at' })
  usedAt: Date;
}
