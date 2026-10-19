import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CurrencyCode, PriceCurrencyRole } from '@dzencode/contracts';
import { ProductEntity } from './product.entity';

@Entity('product_prices')
export class ProductPriceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => ProductEntity, (product) => product.prices, {
    onDelete: 'CASCADE',
  })
  product: ProductEntity;

  @Column({ type: 'real' })
  value: number;

  @Column({
    name: 'currency_code',
    type: 'text',
    default: CurrencyCode.UAH,
  })
  currencyCode: CurrencyCode;

  @Column({
    name: 'currency_role',
    type: 'text',
    default: PriceCurrencyRole.PRIMARY_SETTLEMENT,
  })
  currencyRole: PriceCurrencyRole;
}
