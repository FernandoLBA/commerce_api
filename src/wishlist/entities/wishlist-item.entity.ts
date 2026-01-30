import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  BeforeInsert,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity('wishlist_items')
@Unique(['userId', 'productId', 'variantId'])
@Index(['userId', 'createdAt'])
export class WishlistItem {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'variant_id', nullable: true })
  variantId?: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'variant_id' })
  variant?: ProductVariant;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'price_when_added', type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceWhenAdded?: number;

  @Column({ name: 'notify_on_price_drop', default: false })
  notifyOnPriceDrop: boolean;

  @Column({ name: 'notify_on_back_in_stock', default: false })
  notifyOnBackInStock: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
