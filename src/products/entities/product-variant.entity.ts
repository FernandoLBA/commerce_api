import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Product } from './product.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  compareAtPrice: number; // Precio tachado (antes)

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @Column()
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToMany(() => ProductAttributeValue, (value) => value.variants)
  @JoinTable({
    name: 'variant_attribute_values',
    joinColumn: { name: 'variantId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'attributeValueId', referencedColumnName: 'id' },
  })
  attributeValues: ProductAttributeValue[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
