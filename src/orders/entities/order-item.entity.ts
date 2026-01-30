import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  // Product snapshot (stored at order time)
  @Column()
  productId: string;

  @Column()
  productName: string;

  @Column({ nullable: true })
  productSlug?: string;

  @Column({ nullable: true })
  productImage?: string;

  // Variant info (if applicable)
  @Column({ nullable: true, type: 'uuid' })
  variantId?: string | null;

  @Column({ nullable: true })
  variantSku?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  variantAttributes?: {
    name: string;
    value: string;
  }[];

  // Pricing at order time
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
