import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../../orders/entities/order.entity';
import { ShippingCarrier } from '../enums/shipping-carrier.enum';
import { ShippingStatus } from '../enums/shipping-status.enum';

@Entity('shipments')
export class Shipment {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'enum', enum: ShippingCarrier })
  carrier: ShippingCarrier;

  @Column({ type: 'enum', enum: ShippingStatus, default: ShippingStatus.PENDING })
  status: ShippingStatus;

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber: string;

  @Column({ name: 'tracking_url', nullable: true })
  trackingUrl: string;

  @Column({ name: 'recipient_name', nullable: true })
  recipientName: string;

  @Column({ name: 'recipient_phone', nullable: true })
  recipientPhone: string;

  @Column({ name: 'address_line_1', nullable: true })
  addressLine1: string;

  @Column({ name: 'address_line_2', nullable: true })
  addressLine2: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @Column({ nullable: true })
  country: string;

  @Column('decimal', { precision: 10, scale: 2 })
  cost: number;

  @Column({ default: 'PEN' })
  currency: string;

  @Column('decimal', { name: 'weight_kg', precision: 6, scale: 2, nullable: true })
  weightKg: number;

  @Column({ name: 'estimated_delivery_date', type: 'date', nullable: true })
  estimatedDeliveryDate: Date;

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  shippedAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
