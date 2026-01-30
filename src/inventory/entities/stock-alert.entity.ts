import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('stock_alerts')
export class StockAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', nullable: true })
  productId?: string;

  @OneToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'variant_id', nullable: true })
  variantId?: string;

  @OneToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variant_id' })
  variant?: ProductVariant;

  @Column({ name: 'low_stock_threshold', type: 'int', default: 10 })
  lowStockThreshold: number;

  @Column({ name: 'critical_stock_threshold', type: 'int', default: 0 })
  criticalStockThreshold: number;

  @Column({ name: 'alert_enabled', default: true })
  alertEnabled: boolean;

  @Column({ name: 'last_alert_sent_at', nullable: true })
  lastAlertSentAt?: Date;

  @Column({ name: 'alert_count', type: 'int', default: 0 })
  alertCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
