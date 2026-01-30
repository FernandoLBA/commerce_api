import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('reviews')
@Unique(['userId', 'productId'])
@Index(['productId', 'createdAt'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ name: 'is_verified_purchase', default: false })
  isVerifiedPurchase: boolean;

  @Column({ name: 'is_approved', default: true })
  isApproved: boolean;

  @Column({ name: 'helpful_count', default: 0 })
  helpfulCount: number;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ name: 'admin_response', nullable: true })
  adminResponse?: string;

  @Column({ name: 'admin_response_at', nullable: true })
  adminResponseAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
