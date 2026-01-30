import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('wishlist_items')
@Unique(['userId', 'productId', 'variantId'])
@Index(['userId', 'createdAt'])
export class WishlistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  variantId?: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'variantId' })
  variant?: ProductVariant;

  @Column({ type: 'text', nullable: true })
  notes?: string; // Notas personales del usuario

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceWhenAdded?: number; // Precio cuando se agregó (para alertas)

  @Column({ default: false })
  notifyOnPriceDrop: boolean; // Notificar si baja el precio

  @Column({ default: false })
  notifyOnBackInStock: boolean; // Notificar cuando vuelva a estar disponible

  @CreateDateColumn()
  createdAt: Date;
}
