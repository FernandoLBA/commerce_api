import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';
import { OrderStatus } from '../enums/order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ unique: true })
  orderNumber: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  // Shipping address (embedded, snapshot at order time)
  @Column({ type: 'jsonb' })
  shippingAddress: {
    recipientName: string;
    recipientPhone: string;
    street: string;
    number: string;
    apartment?: string;
    district: string;
    city: string;
    department: string;
    postalCode: string;
    reference?: string;
  };

  // Order totals
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  // Discount code if applied
  @Column({ nullable: true })
  discountCode?: string;

  // Customer notes
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Admin notes (internal)
  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  // Tracking info
  @Column({ nullable: true })
  trackingNumber?: string;

  @Column({ nullable: true })
  trackingUrl?: string;

  // Timestamps
  @Column({ type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt?: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order, { cascade: true })
  payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
