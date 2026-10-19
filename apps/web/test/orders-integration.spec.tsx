import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from '../src/store/slices/orders-slice';
import uiReducer from '../src/store/slices/ui-slice';
import authReducer from '../src/store/slices/auth-slice';
import sessionReducer from '../src/store/slices/session-slice';
import productsReducer from '../src/store/slices/products-slice';
import OrdersPage from '../src/app/orders/page';
import { CurrencyCode, PriceCurrencyRole, ProductCondition, ProductOperationalStatus } from '@dzencode/contracts';

// Mock apiClient to prevent real network calls
jest.mock('../src/services/api-client', () => ({
  apiClient: {
    getOrders: jest.fn().mockResolvedValue([
      {
        id: 'ord-integ-1',
        title: 'Приход #1 Samsung & Apple',
        description: 'Integration test order',
        location: 'Kyiv Central',
        createdAt: '2026-02-15T12:00:00.000Z',
        productsCount: 2,
        totalPrices: [
          { value: 1200, currencyCode: 'USD', currencyRole: 'VALUATION_REFERENCE' },
          { value: 49200, currencyCode: 'UAH', currencyRole: 'PRIMARY_SETTLEMENT' },
        ],
        products: [
          {
            id: 'p-1',
            title: 'Samsung 49" Odyssey G9',
            serialNumber: 9901,
            photo: 'default-product.png',
            condition: 'NEW',
            operationalStatus: 'AVAILABLE',
            orderId: 'ord-integ-1',
          },
        ],
      },
      {
        id: 'ord-integ-2',
        title: 'Приход #2 Dell Laptops',
        description: 'Second order',
        location: 'Kyiv Hub',
        createdAt: '2026-02-16T10:00:00.000Z',
        productsCount: 1,
        totalPrices: [
          { value: 800, currencyCode: 'USD', currencyRole: 'VALUATION_REFERENCE' },
          { value: 32800, currencyCode: 'UAH', currencyRole: 'PRIMARY_SETTLEMENT' },
        ],
        products: [],
      },
    ]),
    deleteOrder: jest.fn().mockResolvedValue({ success: true, id: 'ord-integ-1' }),
  },
}));

function renderWithStore() {
  const store = configureStore({
    reducer: {
      orders: ordersReducer,
      products: productsReducer,
      ui: uiReducer,
      auth: authReducer,
      session: sessionReducer,
    },
  });

  const renderResult = render(
    <Provider store={store}>
      <OrdersPage />
    </Provider>,
  );

  return { store, ...renderResult };
}

describe('Frontend Orders Page Integration Tests (Redux + Master-Detail View)', () => {
  it('renders orders list and switches to Master-Detail Split View on selection', async () => {
    renderWithStore();

    // 1. Wait for orders to load from apiClient
    await waitFor(() => {
      expect(screen.getByText('Приход #1 Samsung & Apple')).toBeTruthy();
      expect(screen.getByText('Приход #2 Dell Laptops')).toBeTruthy();
    });

    // 2. Click on the first order to select it
    const orderTitle = screen.getByText('Приход #1 Samsung & Apple');
    fireEvent.click(orderTitle);

    // 3. Verify Master-Detail Split View is active: OrderDetailPanel shows the order title and product
    await waitFor(() => {
      expect(screen.getByText('Samsung 49" Odyssey G9')).toBeTruthy();
      expect(screen.getByText('Добавить продукт')).toBeTruthy();
    });

    // 4. Close the detail panel
    const closeBtn = screen.getByTitle('Закрыть панель деталей');
    fireEvent.click(closeBtn);

    // 5. Verify detail panel is closed
    await waitFor(() => {
      expect(screen.queryByText('Добавить продукт')).toBeNull();
    });
  });

  it('opens DeleteConfirmModal and allows cancellation', async () => {
    renderWithStore();

    await waitFor(() => {
      expect(screen.getByText('Приход #1 Samsung & Apple')).toBeTruthy();
    });

    // Click trash button on the first order card
    const deleteBtns = screen.getAllByTitle('Удалить приход');
    fireEvent.click(deleteBtns[0]);

    // Modal appears
    await waitFor(() => {
      expect(screen.getByText('Вы уверены, что хотите удалить этот приход?')).toBeTruthy();
      expect(screen.getByText('ОТМЕНИТЬ')).toBeTruthy();
    });

    // Click cancel
    fireEvent.click(screen.getByText('ОТМЕНИТЬ'));

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByText('Вы уверены, что хотите удалить этот приход?')).toBeNull();
    });
  });
});
