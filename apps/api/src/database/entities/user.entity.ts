import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '@dzencode/contracts';
import { OrderEntity } from './order.entity';
import { ProductEntity } from './product.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'google_id', unique: true })
  googleId: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'avatar_url', type: 'text' })
  avatarUrl: string;

  @Column({
    type: 'text',
    default: UserRole.MANAGER,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => OrderEntity, (order) => order.createdBy)
  createdOrders: OrderEntity[];

  @OneToMany(() => ProductEntity, (product) => product.assignedUser)
  assignedProducts: ProductEntity[];
}
