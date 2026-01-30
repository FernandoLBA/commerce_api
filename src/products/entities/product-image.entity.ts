import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  url: string;

  @Column({ length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({ length: 200, nullable: true })
  publicId: string; // Cloudinary public_id for deletion

  @Column({ length: 200, nullable: true })
  altText: string;

  @Column({ type: 'int', default: 0 })
  position: number; // For ordering images

  @Column({ default: false })
  isPrimary: boolean;

  @Column()
  productId: string;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
