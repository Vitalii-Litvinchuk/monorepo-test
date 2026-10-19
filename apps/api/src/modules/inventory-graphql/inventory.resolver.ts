import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';

@ObjectType('GqlProductPrice')
export class GqlProductPrice {
  @Field(() => ID)
  id: string;

  @Field(() => Float)
  value: number;

  @Field()
  currencyCode: string;

  @Field()
  currencyRole: string;
}

@ObjectType('GqlProduct')
export class GqlProduct {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  serialNumber: number;

  @Field()
  condition: string;

  @Field()
  operationalStatus: string;

  @Field()
  photo: string;

  @Field()
  title: string;

  @Field()
  type: string;

  @Field()
  specification: string;

  @Field()
  orderId: string;

  @Field({ nullable: true })
  orderTitle?: string;

  @Field({ nullable: true })
  groupTitle?: string;

  @Field({ nullable: true })
  assignedUserName?: string;

  @Field(() => [GqlProductPrice])
  prices: GqlProductPrice[];
}

@ObjectType('GqlOrderPrice')
export class GqlOrderPrice {
  @Field(() => Float)
  value: number;

  @Field()
  currencyCode: string;

  @Field()
  currencyRole: string;
}

@ObjectType('GqlOrder')
export class GqlOrder {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  location?: string;

  @Field(() => Float, { nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  longitude?: number;

  @Field()
  createdAt: string;

  @Field(() => Int)
  productsCount: number;

  @Field(() => [GqlOrderPrice])
  totalPrices: GqlOrderPrice[];

  @Field(() => [GqlProduct], { nullable: true })
  products?: GqlProduct[];
}

@Resolver()
export class InventoryResolver {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
  ) {}

  @Query(() => [GqlOrder], { name: 'orders' })
  async getOrders(): Promise<GqlOrder[]> {
    const orders = await this.ordersService.findAll();
    return orders as any;
  }

  @Query(() => GqlOrder, { name: 'order', nullable: true })
  async getOrder(@Args('id', { type: () => ID }) id: string): Promise<GqlOrder> {
    const order = await this.ordersService.findOne(id);
    return order as any;
  }

  @Query(() => [GqlProduct], { name: 'products' })
  async getProducts(
    @Args('type', { nullable: true }) type?: string,
  ): Promise<GqlProduct[]> {
    const products = await this.productsService.findAll(type ? { type } : undefined);
    return products as any;
  }
}
