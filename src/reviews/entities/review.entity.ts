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
@Unique(['userId', 'productId']) // Un usuario solo puede hacer una reseña por producto
@Index(['productId', 'createdAt'])
export class Review {
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

  @Column({ type: 'int' })
  rating: number; // 1-5 estrellas

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ default: false })
  isVerifiedPurchase: boolean; // Si el usuario compró el producto

  @Column({ default: true })
  isApproved: boolean; // Moderación

  @Column({ default: 0 })
  helpfulCount: number; // Votos de "útil"

  @Column({ type: 'simple-array', nullable: true })
  images?: string[]; // URLs de imágenes adjuntas

  @Column({ nullable: true })
  adminResponse?: string; // Respuesta del vendedor

  @Column({ nullable: true })
  adminResponseAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
