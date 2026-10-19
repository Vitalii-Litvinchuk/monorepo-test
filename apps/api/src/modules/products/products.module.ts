import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ProductEntity,
  ProductPriceEntity,
  OrderEntity,
  GroupEntity,
  UserEntity,
} from '../../database/entities';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductEntity,
      ProductPriceEntity,
      OrderEntity,
      GroupEntity,
      UserEntity,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
