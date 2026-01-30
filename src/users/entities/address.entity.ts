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

  @Column({ length: 100 })
  label: string; // e.g., "Casa", "Oficina"

  @Column({ length: 200 })
  street: string;

  @Column({ length: 50, nullable: true })
  number: string;

  @Column({ length: 100, nullable: true })
  apartment: string; // Dpto, piso, etc.

  @Column({ length: 100 })
  district: string; // Distrito

  @Column({ length: 100 })
  city: string; // Ciudad/Provincia

  @Column({ length: 100 })
  department: string; // Departamento (Lima, Arequipa, etc.)

  @Column({ length: 10, nullable: true })
  postalCode: string;

  @Column({ length: 100 })
  recipientName: string;

  @Column({ length: 20 })
  recipientPhone: string;

  @Column({ type: 'text', nullable: true })
  reference: string; // Referencia para ubicar

  @Column({ default: false })
  isDefault: boolean;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.addresses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
