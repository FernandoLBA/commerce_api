import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { ProductAttribute } from './product-attribute.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('product_attribute_values')
export class ProductAttributeValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  value: string; // e.g., "S", "M", "L", "Rojo", "Azul"

  @Column({ length: 50, nullable: true })
  displayValue: string; // For colors: hex code "#FF0000"

  @Column()
  attributeId: string;

  @ManyToOne(() => ProductAttribute, (attribute) => attribute.values, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attributeId' })
  attribute: ProductAttribute;

  @ManyToMany(() => ProductVariant, (variant) => variant.attributeValues)
  variants: ProductVariant[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
