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

  @Column()
  couponId: string;

  @ManyToOne(() => Coupon, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'couponId' })
  coupon: Coupon;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  orderId?: string;

  @ManyToOne(() => Order, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'orderId' })
  order?: Order;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountApplied: number;

  @CreateDateColumn()
  usedAt: Date;
}
