import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { ProductEntity } from './product.entity';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'Warehouse #1 (Kyiv Central)' })
  location: string;

  @Column({ type: 'real', default: 50.4501 })
  latitude: number;

  @Column({ type: 'real', default: 30.5234 })
  longitude: number;

  @ManyToOne(() => UserEntity, (user) => user.createdOrders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  createdBy: UserEntity;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ProductEntity, (product) => product.order, {
    cascade: true,
  })
  products: ProductEntity[];
}
