import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  ProductCondition,
  ProductOperationalStatus,
} from '@dzencode/contracts';
import { OrderEntity } from './order.entity';
import { GroupEntity } from './group.entity';
import { UserEntity } from './user.entity';
import { ProductPriceEntity } from './product-price.entity';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'serial_number' })
  serialNumber: number;

  @Column({
    type: 'text',
    default: ProductCondition.NEW,
  })
  condition: ProductCondition;

  @Column({
    name: 'operational_status',
    type: 'text',
    default: ProductOperationalStatus.AVAILABLE,
  })
  operationalStatus: ProductOperationalStatus;

  @Column()
  photo: string;

  @Column()
  title: string;

  @Column()
  type: string;

  @Column({ type: 'text' })
  specification: string;

  @Column({ name: 'guarantee_start', type: 'datetime' })
  guaranteeStart: Date;

  @Column({ name: 'guarantee_end', type: 'datetime' })
  guaranteeEnd: Date;

  @Column({ name: 'order_id' })
  orderId: string;

  @ManyToOne(() => OrderEntity, (order) => order.products, {
    onDelete: 'CASCADE',
  })
  order: OrderEntity;

  @Column({ name: 'group_id', nullable: true })
  groupId: string | null;

  @ManyToOne(() => GroupEntity, (group) => group.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  group: GroupEntity | null;

  @Column({ name: 'assigned_user_id', nullable: true })
  assignedUserId: string | null;

  @ManyToOne(() => UserEntity, (user) => user.assignedProducts, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  assignedUser: UserEntity | null;

  @OneToMany(() => ProductPriceEntity, (price) => price.product, {
    cascade: true,
  })
  prices: ProductPriceEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
