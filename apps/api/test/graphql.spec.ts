import { InventoryResolver } from '../src/modules/inventory-graphql/inventory.resolver';
import { OrdersService } from '../src/modules/orders/orders.service';
import { ProductsService } from '../src/modules/products/products.service';

describe('GraphQL InventoryResolver Unit Test', () => {
  let resolver: InventoryResolver;
  let mockOrdersService: Partial<OrdersService>;
  let mockProductsService: Partial<ProductsService>;

  beforeEach(() => {
    mockOrdersService = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'ord-1',
          title: 'Order 1',
          description: 'Desc 1',
          productsCount: 2,
          totalPrices: [{ value: 100, currencyCode: 'USD', currencyRole: 'primary' }],
          createdAt: new Date().toISOString(),
        },
      ]),
      findOne: jest.fn().mockImplementation(async (id: string) => ({
        id,
        title: `Order ${id}`,
        description: 'Detail',
        productsCount: 1,
        totalPrices: [{ value: 50, currencyCode: 'USD', currencyRole: 'primary' }],
        createdAt: new Date().toISOString(),
      })),
    };

    mockProductsService = {
      findAll: jest.fn().mockResolvedValue([
        {
          id: 'prod-1',
          serialNumber: 12345,
          title: 'Monitor',
          type: 'Monitors',
          condition: 'NEW',
          operationalStatus: 'AVAILABLE',
          photo: 'photo.png',
          orderId: 'ord-1',
          prices: [{ id: 'p-1', value: 200, currencyCode: 'USD', currencyRole: 'primary' }],
        },
      ]),
    };

    resolver = new InventoryResolver(
      mockOrdersService as OrdersService,
      mockProductsService as ProductsService,
    );
  });

  it('should query orders list', async () => {
    const orders = await resolver.getOrders();
    expect(orders).toBeDefined();
    expect(orders.length).toBe(1);
    expect(orders[0].title).toBe('Order 1');
    expect(mockOrdersService.findAll).toHaveBeenCalled();
  });

  it('should query single order by id', async () => {
    const order = await resolver.getOrder('ord-99');
    expect(order).toBeDefined();
    expect(order.id).toBe('ord-99');
    expect(order.title).toBe('Order ord-99');
    expect(mockOrdersService.findOne).toHaveBeenCalledWith('ord-99');
  });

  it('should query products with optional filter', async () => {
    const products = await resolver.getProducts('Monitors');
    expect(products).toBeDefined();
    expect(products.length).toBe(1);
    expect(products[0].type).toBe('Monitors');
    expect(mockProductsService.findAll).toHaveBeenCalledWith({ type: 'Monitors' });
  });
});
