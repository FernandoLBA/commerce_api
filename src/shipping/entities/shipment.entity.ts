import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { ShippingCarrier } from '../enums/shipping-carrier.enum';
import { ShippingStatus } from '../enums/shipping-status.enum';

@Entity('shipments')
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'enum', enum: ShippingCarrier })
  carrier: ShippingCarrier;

  @Column({ type: 'enum', enum: ShippingStatus, default: ShippingStatus.PENDING })
  status: ShippingStatus;

  @Column({ nullable: true })
  trackingNumber: string;

  @Column({ nullable: true })
  trackingUrl: string;

  @Column('decimal', { precision: 10, scale: 2 })
  cost: number;

  @Column({ default: 'PEN' })
  currency: string;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  weightKg: number;

  @Column('jsonb', { nullable: true })
  dimensions: {
    lengthCm: number;
    widthCm: number;
    heightCm: number;
  };

  @Column({ type: 'date', nullable: true })
  estimatedDeliveryDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  pickedUpAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ nullable: true })
  deliveryNotes: string;

  @Column({ nullable: true })
  recipientName: string;

  @Column({ nullable: true })
  signatureUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
