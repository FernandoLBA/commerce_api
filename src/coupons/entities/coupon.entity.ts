import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { DiscountType } from '../enums/discount-type.enum';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ length: 50 })
  code: string; // Código del cupón (ej: VERANO2026)

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: DiscountType })
  discountType: DiscountType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue: number; // Porcentaje (0-100) o monto fijo en PEN

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minPurchaseAmount?: number; // Monto mínimo de compra

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscountAmount?: number; // Descuento máximo (para porcentajes)

  @Column({ type: 'int', nullable: true })
  usageLimit?: number; // Límite total de usos

  @Column({ type: 'int', default: 0 })
  usageCount: number; // Veces que se ha usado

  @Column({ type: 'int', nullable: true })
  usageLimitPerUser?: number; // Límite por usuario

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-array', nullable: true })
  applicableCategories?: string[]; // IDs de categorías donde aplica

  @Column({ type: 'simple-array', nullable: true })
  applicableProducts?: string[]; // IDs de productos donde aplica

  @Column({ type: 'simple-array', nullable: true })
  excludedProducts?: string[]; // IDs de productos excluidos

  @Column({ default: false })
  isFirstPurchaseOnly: boolean; // Solo para primera compra

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
