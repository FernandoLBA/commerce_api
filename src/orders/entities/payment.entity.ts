import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'PEN' })
  currency: string;

  // External payment provider info
  @Index()
  @Column({ nullable: true })
  externalId?: string; // Stripe payment_intent_id or MercadoPago preference_id

  @Column({ nullable: true })
  externalStatus?: string;

  @Column({ type: 'jsonb', nullable: true })
  externalData?: Record<string, any>; // Raw response from provider

  // Error info if failed
  @Column({ nullable: true })
  errorCode?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  // Refund info
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundedAmount?: number;

  @Column({ nullable: true })
  refundId?: string;

  @Column({ type: 'timestamp', nullable: true })
  refundedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
