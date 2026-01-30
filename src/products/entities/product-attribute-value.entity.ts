import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  BeforeInsert,
} from 'typeorm';
import { v4 } from 'uuid';
import { ProductAttribute } from './product-attribute.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('product_attribute_values')
export class ProductAttributeValue {
  @PrimaryColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = v4() as string;
    }
  }

  @Column({ length: 100 })
  value: string;

  @Column({ name: 'attribute_id' })
  attributeId: string;

  @ManyToOne(() => ProductAttribute, (attribute) => attribute.values, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attribute_id' })
  attribute: ProductAttribute;

  @ManyToMany(() => ProductVariant, (variant) => variant.attributeValues)
  variants: ProductVariant[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
