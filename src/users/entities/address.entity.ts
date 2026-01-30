import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recipient_name', length: 100 })
  recipientName: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ length: 200 })
  street: string;

  @Column({ length: 50, nullable: true })
  number: string;

  @Column({ length: 100, nullable: true })
  apartment: string;

  @Column({ length: 100 })
  district: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 100 })
  department: string;

  @Column({ name: 'postal_code', length: 10, nullable: true })
  postalCode: string;

  @Column({ type: 'text', nullable: true })
  reference: string;

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
