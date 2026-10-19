import ordersReducer, {
  selectOrder,
  setOrderToDelete,
  onOrderCreatedWs,
  onOrderDeletedWs,
  OrdersState,
} from './index';
import { CurrencyCode, PriceCurrencyRole } from '@dzencode/contracts';

describe('Orders Redux Slice Unit Tests', () => {
  const initialState: OrdersState = {
    items: [],
    selectedOrderId: null,
    orderToDelete: null,
    loading: false,
    error: null,
  };

  it('should select order on selectOrder action', () => {
    const state = ordersReducer(initialState, selectOrder('order-123'));
    expect(state.selectedOrderId).toBe('order-123');
  });

  it('should set order to delete on setOrderToDelete action', () => {
    const mockOrder: any = { id: 'order-del', title: 'To Delete' };
    const state = ordersReducer(initialState, setOrderToDelete(mockOrder));
    expect(state.orderToDelete?.id).toBe('order-del');
  });

  it('should add order to items on onOrderCreatedWs action', () => {
    const mockOrder = {
      id: 'order-1',
      title: 'New Order',
      description: 'Desc',
      createdAt: '2026-01-01',
      productsCount: 0,
      totalPrices: [
        {
          value: 0,
          currencyCode: CurrencyCode.USD,
          currencyRole: PriceCurrencyRole.VALUATION_REFERENCE,
        },
      ],
    };

    const state = ordersReducer(initialState, onOrderCreatedWs(mockOrder));
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe('order-1');
  });

  it('should remove order on onOrderDeletedWs and clear selectedOrderId', () => {
    const stateWithOrder: OrdersState = {
      ...initialState,
      items: [
        {
          id: 'order-1',
          title: 'New Order',
          description: 'Desc',
          createdAt: '2026-01-01',
          productsCount: 0,
          totalPrices: [],
        },
      ],
      selectedOrderId: 'order-1',
    };

    const state = ordersReducer(stateWithOrder, onOrderDeletedWs('order-1'));
    expect(state.items).toHaveLength(0);
    expect(state.selectedOrderId).toBeNull();
  });
});
