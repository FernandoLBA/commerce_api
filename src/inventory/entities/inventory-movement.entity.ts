import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { MovementType } from '../enums/movement-type.enum';

@Entity('inventory_movements')
@Index(['productId', 'createdAt'])
@Index(['variantId', 'createdAt'])
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  productId?: string;

  @ManyToOne(() => Product, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ nullable: true })
  variantId?: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variantId' })
  variant?: ProductVariant;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'int' })
  quantity: number; // Positivo para entradas, negativo para salidas

  @Column({ type: 'int' })
  previousStock: number;

  @Column({ type: 'int' })
  newStock: number;

  @Column({ nullable: true })
  orderId?: string; // Referencia a la orden si aplica

  @Column({ nullable: true })
  referenceNumber?: string; // Número de factura, guía, etc.

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ nullable: true })
  performedBy?: string; // User ID que realizó el movimiento

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost?: number; // Costo unitario (para compras)

  @CreateDateColumn()
  createdAt: Date;
}
