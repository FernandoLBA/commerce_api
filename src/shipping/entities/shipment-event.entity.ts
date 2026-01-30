import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Shipment } from './shipment.entity';
import { ShippingStatus } from '../enums/shipping-status.enum';

@Entity('shipment_events')
export class ShipmentEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shipment_id' })
  shipmentId: string;

  @ManyToOne(() => Shipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shipment_id' })
  shipment: Shipment;

  @Column({ type: 'enum', enum: ShippingStatus })
  status: ShippingStatus;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'occurred_at', type: 'timestamp' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
