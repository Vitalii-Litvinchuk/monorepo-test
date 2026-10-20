import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ordersReducer from '../src/store/slices/orders-slice';
import uiReducer, { setLanguage } from '../src/store/slices/ui-slice';
import authReducer from '../src/store/slices/auth-slice';
import sessionReducer from '../src/store/slices/session-slice';
import productsReducer from '../src/store/slices/products-slice';
import groupsReducer from '../src/store/slices/groups-slice';
import ProductsPage from '../src/app/products/page';

// Mock apiClient to prevent real network calls
jest.mock('../src/services/api-client', () => ({
  apiClient: {
    getProducts: jest.fn().mockResolvedValue([
      {
        id: 'prod-test-1',
        serialNumber: 1001,
        condition: 'NEW',
        operationalStatus: 'AVAILABLE',
        photo: 'default-product.png',
        title: 'Apple MacBook Pro 16 M3 Max',
        type: 'Ноутбуки',
        specification: 'Specification 1',
        guarantee: {
          start: '2026-01-01T00:00:00.000Z',
          end: '2027-01-01T00:00:00.000Z',
        },
        prices: [
          {
            id: 'pr-1',
            productId: 'prod-test-1',
            value: 3500,
            currencyCode: 'USD',
            currencyRole: 'VALUATION_REFERENCE',
          },
          {
            id: 'pr-2',
            productId: 'prod-test-1',
            value: 143500,
            currencyCode: 'UAH',
            currencyRole: 'PRIMARY_SETTLEMENT',
          },
        ],
        orderId: 'ord-1',
        orderTitle: 'Приход #1 Apple',
        groupId: null,
        assignedUserId: null,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'prod-test-2',
        serialNumber: 1002,
        condition: 'USED',
        operationalStatus: 'IN_REPAIR',
        photo: 'default-product.png',
        title: 'Dell UltraSharp 34 Curved',
        type: 'Мониторы',
        specification: 'Specification 2',
        guarantee: {
          start: '2025-06-01T00:00:00.000Z',
          end: '2026-06-01T00:00:00.000Z',
        },
        prices: [
          {
            id: 'pr-3',
            productId: 'prod-test-2',
            value: 800,
            currencyCode: 'USD',
            currencyRole: 'VALUATION_REFERENCE',
          },
        ],
        orderId: 'ord-2',
        orderTitle: 'Приход #2 Dell',
        groupId: null,
        assignedUserId: null,
        createdAt: '2026-01-02T00:00:00.000Z',
      },
    ]),
    getProductTypes: jest.fn().mockResolvedValue(['Ноутбуки', 'Мониторы']),
    getProductSpecifications: jest.fn().mockResolvedValue(['Specification 1', 'Specification 2']),
    getOrders: jest.fn().mockResolvedValue([
      {
        id: 'ord-1',
        title: 'Приход #1 Apple',
        productsCount: 1,
        totalPrices: [],
        createdAt: '2026-01-01',
      },
    ]),
    createProduct: jest.fn().mockImplementation((dto) =>
      Promise.resolve({
        id: 'prod-created-99',
        ...dto,
        createdAt: '2026-03-01T00:00:00.000Z',
      }),
    ),
    updateProduct: jest.fn().mockImplementation((id, dto) =>
      Promise.resolve({
        id,
        ...dto,
      }),
    ),
    deleteProduct: jest.fn().mockResolvedValue({ success: true, id: 'prod-test-1' }),
    getGroups: jest.fn().mockResolvedValue([]),
    getUsers: jest.fn().mockResolvedValue([]),
    getOrders: jest.fn().mockResolvedValue([]),
  },
}));

function renderProductsWithStore() {
  const store = configureStore({
    reducer: {
      orders: ordersReducer,
      products: productsReducer,
      groups: groupsReducer,
      ui: uiReducer,
      auth: authReducer,
      session: sessionReducer,
    },
  });

  const renderResult = render(
    <Provider store={store}>
      <ProductsPage />
    </Provider>,
  );

  return { store, ...renderResult };
}

describe('Frontend Products Page Integration Tests (Table Grid, Custom Modals & Contextual Search)', () => {
  it('renders products table with aligned column headers and rows', async () => {
    renderProductsWithStore();

    // 1. Column headers exist
    expect(screen.getByText(/Наименование/i)).toBeTruthy();
    expect(screen.getByText(/Статус/i)).toBeTruthy();
    expect(screen.getByText(/Гарантия/i)).toBeTruthy();
    expect(screen.getByText(/Стоимость/i)).toBeTruthy();
    expect(screen.getByText(/Привязка/i)).toBeTruthy();

    // 2. Products are rendered
    await waitFor(() => {
      expect(screen.getByText('Apple MacBook Pro 16 M3 Max')).toBeTruthy();
      expect(screen.getByText('Dell UltraSharp 34 Curved')).toBeTruthy();
    });
  });

  it('opens custom ProductFormModal when clicking + Add button', async () => {
    renderProductsWithStore();

    const addBtn = screen.getByTitle('Добавить продукт');
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByText('Новый продукт')).toBeTruthy();
      expect(screen.getByRole('button', { name: /сохранить/i })).toBeTruthy();
    });

    // Close modal
    fireEvent.click(screen.getByText('ОТМЕНИТЬ'));
    await waitFor(() => {
      expect(screen.queryByText('Новый продукт')).toBeNull();
    });
  });

  it('opens custom DeleteConfirmModal when clicking delete icon on a product', async () => {
    renderProductsWithStore();

    await waitFor(() => {
      expect(screen.getByText('Apple MacBook Pro 16 M3 Max')).toBeTruthy();
    });

    const deleteBtns = screen.getAllByTitle('Удалить продукт');
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(
        screen.getByText(/Вы уверены, что хотите удалить продукт "Apple MacBook Pro 16 M3 Max"\?/i),
      ).toBeTruthy();
      expect(screen.getByText('ОТМЕНИТЬ')).toBeTruthy();
    });

    // Cancel deletion
    fireEvent.click(screen.getByText('ОТМЕНИТЬ'));
    await waitFor(() => {
      expect(
        screen.queryByText(/Вы уверены, что хотите удалить продукт "Apple MacBook Pro 16 M3 Max"\?/i),
      ).toBeNull();
    });
  });

  it('opens custom ProductFormModal in edit mode when clicking pencil icon', async () => {
    renderProductsWithStore();

    await waitFor(() => {
      expect(screen.getByText('Apple MacBook Pro 16 M3 Max')).toBeTruthy();
    });

    const editBtns = screen.getAllByTitle('Редактировать продукт');
    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Редактировать продукт')).toBeTruthy();
      expect(screen.getByDisplayValue('Apple MacBook Pro 16 M3 Max')).toBeTruthy();
    });
  });

  it('opens TypeCreateModal and allows creating a new type with full i18n support', async () => {
    const { store } = renderProductsWithStore();

    const addTypeBtn = screen.getByText('+ Тип');
    fireEvent.click(addTypeBtn);

    // Initial language is Russian
    await waitFor(() => {
      expect(screen.getByText('Новый тип продукта')).toBeTruthy();
      expect(screen.getByPlaceholderText(/Смартфоны, Планшеты/i)).toBeTruthy();
    });

    // Switch language to Ukrainian dynamically
    act(() => {
      store.dispatch(setLanguage('ua'));
    });

    await waitFor(() => {
      expect(screen.getByText('Новий тип продукту')).toBeTruthy();
      expect(screen.getByPlaceholderText(/Смартфони, Планшети/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByText('СКАСУВАТИ'));
    await waitFor(() => {
      expect(screen.queryByText('Новий тип продукту')).toBeNull();
    });
  });
});
