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

  @Column({ nullable: true })
  productId?: string;

  @OneToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ nullable: true })
  variantId?: string;

  @OneToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant?: ProductVariant;

  @Column({ type: 'int', default: 10 })
  lowStockThreshold: number; // Umbral para alerta de bajo stock

  @Column({ type: 'int', default: 0 })
  criticalStockThreshold: number; // Umbral crítico (ej: 0)

  @Column({ default: true })
  alertEnabled: boolean;

  @Column({ nullable: true })
  lastAlertSentAt?: Date;

  @Column({ type: 'int', default: 0 })
  alertCount: number; // Cuántas alertas se han enviado

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
