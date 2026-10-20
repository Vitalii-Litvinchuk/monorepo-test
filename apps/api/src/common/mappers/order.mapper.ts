import { OrderEntity } from '../../database/entities';
import {
  CurrencyCode,
  Order,
  PriceCurrencyRole,
} from '@dzencode/contracts';
import { ProductMapper } from './product.mapper';

export class OrderMapper {
  static toDto(entity: OrderEntity): Order {
    const products = entity.products || [];
    const productsCount = products.length;

    let totalUah = 0;
    let totalUsd = 0;

    for (const prod of products) {
      if (prod.prices) {
        for (const p of prod.prices) {
          if (p.currencyCode === CurrencyCode.UAH) {
            totalUah += p.value;
          } else if (p.currencyCode === CurrencyCode.USD) {
            totalUsd += p.value;
          }
        }
      }
    }

    const mappedProducts = products.map((prod) => {
      const dto = ProductMapper.toDto(prod);
      if (!dto.orderTitle) {
        dto.orderTitle = entity.title;
      }
      return dto;
    });

    return {
      id: entity.id,
      title: entity.title,
      description: entity.description || '',
      location: entity.location,
      latitude: entity.latitude,
      longitude: entity.longitude,
      createdAt: entity.createdAt ? entity.createdAt.toISOString() : new Date().toISOString(),
      productsCount,
      products: mappedProducts,
      totalPrices: [
        {
          value: totalUsd,
          currencyCode: CurrencyCode.USD,
          currencyRole: PriceCurrencyRole.VALUATION_REFERENCE,
        },
        {
          value: totalUah,
          currencyCode: CurrencyCode.UAH,
          currencyRole: PriceCurrencyRole.PRIMARY_SETTLEMENT,
        },
      ],
    };
  }
}
