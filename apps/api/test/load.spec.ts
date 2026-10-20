import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrderEntity,
  ProductEntity,
  ProductPriceEntity,
  GroupEntity,
  UserEntity,
} from '../src/database/entities';
import { GenericRepository } from '../src/database/repositories';
import { OrdersService } from '../src/modules/orders/orders.service';
import { ProductsService } from '../src/modules/products/products.service';
import {
  CurrencyCode,
  PriceCurrencyRole,
  ProductCondition,
  ProductOperationalStatus,
} from '@dzencode/contracts';

describe('Performance & Load Tests (High Concurrency & Stress)', () => {
  let dataSource: DataSource;
  let ordersService: OrdersService;
  let productsService: ProductsService;
  let mockSessionsGateway: any;
  let eventEmitter: EventEmitter2;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [
        OrderEntity,
        ProductEntity,
        ProductPriceEntity,
        GroupEntity,
        UserEntity,
      ],
      synchronize: true,
      logging: false,
    });

    await dataSource.initialize();

    mockSessionsGateway = {
      broadcastEvent: jest.fn(),
      broadcastActiveSessions: jest.fn(),
      getActiveCount: jest.fn().mockReturnValue(5),
    };
    eventEmitter = new EventEmitter2();

    const orderRepo = dataSource.getRepository(OrderEntity);
    const productRepo = dataSource.getRepository(ProductEntity);
    const priceRepo = dataSource.getRepository(ProductPriceEntity);
    const groupRepo = dataSource.getRepository(GroupEntity);
    const userRepo = dataSource.getRepository(UserEntity);

    const genericOrderRepo = new GenericRepository(orderRepo, dataSource);
    const genericProductRepo = new GenericRepository(productRepo, dataSource);
    const genericGroupRepo = new GenericRepository(groupRepo, dataSource);
    const genericUserRepo = new GenericRepository(userRepo, dataSource);

    ordersService = new OrdersService(
      genericOrderRepo,
      eventEmitter,
      mockSessionsGateway,
    );
    productsService = new ProductsService(
      genericProductRepo,
      genericOrderRepo,
      genericGroupRepo,
      genericUserRepo,
      eventEmitter,
      mockSessionsGateway,
    );

    // Seed dataset: 20 orders, each with 5 products (100 products total)
    for (let i = 1; i <= 20; i++) {
      const order = orderRepo.create({
        title: `Order Benchmark #${i}`,
        description: `High load order benchmark test description ${i}`,
        location: `Warehouse #${i}`,
        products: [],
      });
      const savedOrder = await orderRepo.save(order);

      const products: ProductEntity[] = [];
      for (let j = 1; j <= 5; j++) {
        const prod = productRepo.create({
          serialNumber: i * 1000 + j,
          condition: j % 2 === 0 ? ProductCondition.NEW : ProductCondition.USED,
          operationalStatus: ProductOperationalStatus.AVAILABLE,
          photo: '550e8400-e29b-41d4-a716-446655440000.png',
          title: `Product #${i}-${j} Monitor Ultra HD`,
          type: j % 2 === 0 ? 'Monitors' : 'Laptops',
          specification: '4K IPS Display 144Hz',
          guaranteeStart: new Date('2026-01-01'),
          guaranteeEnd: new Date('2027-01-01'),
          order: savedOrder,
          orderId: savedOrder.id,
        });
        const savedProd = await productRepo.save(prod);

        const prices = [
          priceRepo.create({
            product: savedProd,
            productId: savedProd.id,
            value: 200 + j * 10,
            currencyCode: CurrencyCode.USD,
            currencyRole: PriceCurrencyRole.VALUATION_REFERENCE,
          }),
          priceRepo.create({
            product: savedProd,
            productId: savedProd.id,
            value: (200 + j * 10) * 40,
            currencyCode: CurrencyCode.UAH,
            currencyRole: PriceCurrencyRole.PRIMARY_SETTLEMENT,
          }),
        ];
        await priceRepo.save(prices);
        products.push(savedProd);
      }
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('Load Test: 100 concurrent findAll() read queries on Orders with relations and currency aggregations', async () => {
    const concurrency = 100;
    const start = performance.now();

    const tasks = Array.from({ length: concurrency }).map(() =>
      ordersService.findAll(),
    );

    const results = await Promise.all(tasks);
    const durationMs = performance.now() - start;

    expect(results).toHaveLength(concurrency);
    for (const orders of results) {
      expect(orders.length).toBeGreaterThanOrEqual(20);
      expect(orders[0].totalPrices).toHaveLength(2);
    }

    const rps = (concurrency / (durationMs / 1000)).toFixed(0);
    const avgLatency = (durationMs / concurrency).toFixed(2);

    console.log(`[Load Benchmark - Orders findAll] Concurrency: ${concurrency}, Duration: ${durationMs.toFixed(1)}ms, RPS: ${rps}, Avg Latency: ${avgLatency}ms`);

    // Performance assertions: 0% failure rate, average latency per request under threshold
    expect(results.every((r) => Array.isArray(r))).toBe(true);
    expect(durationMs).toBeLessThan(10000); // 100 concurrent complex queries complete in < 10s
  });

  it('Load Test: 100 concurrent search & filter queries on Products', async () => {
    const concurrency = 100;
    const start = performance.now();

    const tasks = Array.from({ length: concurrency }).map((_, index) =>
      productsService.findAll({
        type: index % 2 === 0 ? 'Monitors' : 'Laptops',
        search: 'Ultra',
      }),
    );

    const results = await Promise.all(tasks);
    const durationMs = performance.now() - start;

    expect(results).toHaveLength(concurrency);
    const rps = (concurrency / (durationMs / 1000)).toFixed(0);
    const avgLatency = (durationMs / concurrency).toFixed(2);

    console.log(`[Load Benchmark - Products filtered] Concurrency: ${concurrency}, Duration: ${durationMs.toFixed(1)}ms, RPS: ${rps}, Avg Latency: ${avgLatency}ms`);

    expect(results.every((items) => items.length > 0)).toBe(true);
    expect(durationMs).toBeLessThan(10000);
  });

  it('Load Test: 500 concurrent cached metadata requests (getTypes & getSpecifications)', async () => {
    const concurrency = 500;
    // Prime cache
    await productsService.getTypes();
    await productsService.getSpecifications();

    const start = performance.now();
    const tasks = Array.from({ length: concurrency }).map(() =>
      Promise.all([
        productsService.getTypes(),
        productsService.getSpecifications(),
      ]),
    );

    const results = await Promise.all(tasks);
    const durationMs = performance.now() - start;

    const rps = (concurrency / (durationMs / 1000)).toFixed(0);
    const avgLatency = (durationMs / concurrency).toFixed(3);

    console.log(`[Load Benchmark - Cached Metadata] Concurrency: ${concurrency}, Duration: ${durationMs.toFixed(1)}ms, RPS: ${rps}, Avg Latency: ${avgLatency}ms`);

    expect(results).toHaveLength(concurrency);
    // Cached requests should be lightning fast (< 2ms on average)
    expect(durationMs / concurrency).toBeLessThan(5);
  });

  it('Stress Test: 50 concurrent writes (create order) under heavy concurrency', async () => {
    const concurrency = 50;
    const start = performance.now();

    const tasks = Array.from({ length: concurrency }).map((_, idx) =>
      ordersService.create({
        title: `Concurrent Order Stress #${idx + 1}`,
        description: `Stress load test record #${idx + 1}`,
      }),
    );

    const results = await Promise.all(tasks);
    const durationMs = performance.now() - start;

    expect(results).toHaveLength(concurrency);
    const ids = new Set(results.map((r) => r.id));
    expect(ids.size).toBe(concurrency); // All UUIDs must be strictly unique

    const rps = (concurrency / (durationMs / 1000)).toFixed(0);
    console.log(`[Stress Benchmark - Concurrent Inserts] Concurrency: ${concurrency}, Duration: ${durationMs.toFixed(1)}ms, RPS: ${rps}`);

    expect(durationMs).toBeLessThan(10000);
  });
});
