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

  @Index()
  @Column({ name: 'external_id', nullable: true })
  externalId?: string;

  @Column({ name: 'external_status', nullable: true })
  externalStatus?: string;

  @Column({ name: 'external_data', type: 'jsonb', nullable: true })
  externalData?: Record<string, any>;

  @Column({ name: 'error_code', nullable: true })
  errorCode?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'refunded_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundedAmount?: number;

  @Column({ name: 'refund_id', nullable: true })
  refundId?: string;

  @Column({ name: 'refund_reason', type: 'text', nullable: true })
  refundReason?: string;

  @Column({ name: 'refunded_at', type: 'timestamp', nullable: true })
  refundedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
