import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductAttributeValue } from './product-attribute-value.entity';

@Entity('product_attributes')
export class ProductAttribute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string; // e.g., "Talla", "Color"

  @Column({ length: 50 })
  type: string; // e.g., "select", "color"

  @OneToMany(() => ProductAttributeValue, (value) => value.attribute)
  values: ProductAttributeValue[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
