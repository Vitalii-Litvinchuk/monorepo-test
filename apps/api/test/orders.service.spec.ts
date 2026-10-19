import { OrdersService } from '../src/modules/orders/orders.service';
import { OrderEntity } from '../src/database/entities';
import { CurrencyCode, PriceCurrencyRole } from '@dzencode/contracts';

describe('OrdersService Unit Tests', () => {
  let service: OrdersService;
  let mockOrderRepo: any;
  let mockEventEmitter: any;
  let mockSessionsGateway: any;

  beforeEach(() => {
    mockOrderRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'test-order-uuid', createdAt: new Date() })),
      save: jest.fn(async (order) => order),
      remove: jest.fn(),
    };
    mockEventEmitter = {
      emit: jest.fn(),
    };
    mockSessionsGateway = {
      broadcastEvent: jest.fn(),
    };

    service = new OrdersService(mockOrderRepo, mockEventEmitter, mockSessionsGateway);
  });

  it('should map dual-currency totals correctly in findAll', async () => {
    const mockOrder: Partial<OrderEntity> = {
      id: 'ord-1',
      title: 'Test Order',
      description: 'Test desc',
      createdAt: new Date('2026-01-01'),
      products: [
        {
          id: 'p-1',
          serialNumber: 100,
          condition: 'NEW' as any,
          operationalStatus: 'AVAILABLE' as any,
          photo: 'test.png',
          title: 'Product 1',
          type: 'Monitors',
          specification: 'Spec 1',
          guaranteeStart: new Date(),
          guaranteeEnd: new Date(),
          orderId: 'ord-1',
          groupId: null,
          assignedUserId: null,
          createdAt: new Date(),
          order: null as any,
          group: null,
          assignedUser: null,
          prices: [
            {
              id: 'pr-1',
              productId: 'p-1',
              product: null as any,
              value: 100,
              currencyCode: CurrencyCode.USD,
              currencyRole: PriceCurrencyRole.VALUATION_REFERENCE,
            },
            {
              id: 'pr-2',
              productId: 'p-1',
              product: null as any,
              value: 2600,
              currencyCode: CurrencyCode.UAH,
              currencyRole: PriceCurrencyRole.PRIMARY_SETTLEMENT,
            },
          ],
        },
      ],
    };

    mockOrderRepo.find.mockResolvedValue([mockOrder]);

    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].productsCount).toBe(1);

    const usdPrice = result[0].totalPrices.find((p) => p.currencyCode === CurrencyCode.USD);
    const uahPrice = result[0].totalPrices.find((p) => p.currencyCode === CurrencyCode.UAH);

    expect(usdPrice?.value).toBe(100);
    expect(uahPrice?.value).toBe(2600);
  });
});
