import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { MovementType } from '../enums/movement-type.enum';

@Entity('inventory_movements')
@Index(['productId', 'createdAt'])
@Index(['variantId', 'createdAt'])
export class InventoryMovement {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  @Column({ name: 'product_id', nullable: true })
  productId?: string;

  @ManyToOne(() => Product, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'variant_id', nullable: true })
  variantId?: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'variant_id' })
  variant?: ProductVariant;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ name: 'previous_stock', type: 'int' })
  previousStock: number;

  @Column({ name: 'new_stock', type: 'int' })
  newStock: number;

  @Column({ name: 'order_id', nullable: true })
  orderId?: string;

  @Column({ name: 'reference_number', nullable: true })
  referenceNumber?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'performed_by', nullable: true })
  performedBy?: string;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  unitCost?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
