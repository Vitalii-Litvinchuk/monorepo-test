import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from '../../store/slices/ui-slice';
import { ProductFormModal } from './index';
import { ProductCondition, ProductOperationalStatus, CurrencyCode, PriceCurrencyRole } from '@dzencode/contracts';

function renderWithStore(ui: React.ReactElement) {
  const store = configureStore({
    reducer: {
      ui: uiReducer,
    },
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('ProductFormModal Component', () => {
  const mockOrders = [
    {
      id: 'ord-1',
      title: 'Основний прихід техніки',
      description: '',
      createdAt: '2026-01-01',
      productsCount: 1,
      totalPrices: [],
    },
  ];

  const mockProduct = {
    id: 'prod-100',
    serialNumber: 12345678,
    condition: ProductCondition.NEW,
    operationalStatus: ProductOperationalStatus.AVAILABLE,
    photo: 'sample.png',
    title: 'Dell UltraSharp 32',
    type: 'Мониторы',
    specification: 'Specification 1',
    guarantee: {
      start: '2026-01-01T00:00:00.000Z',
      end: '2027-01-01T00:00:00.000Z',
    },
    prices: [
      {
        id: 'pr-1',
        productId: 'prod-100',
        value: 500,
        currencyCode: CurrencyCode.USD,
        currencyRole: PriceCurrencyRole.VALUATION_REFERENCE,
      },
      {
        id: 'pr-2',
        productId: 'prod-100',
        value: 20500,
        currencyCode: CurrencyCode.UAH,
        currencyRole: PriceCurrencyRole.PRIMARY_SETTLEMENT,
      },
    ],
    orderId: 'ord-1',
    groupId: null,
    assignedUserId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  it('renders create mode with default fields', () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn().mockResolvedValue(undefined);

    renderWithStore(
      <ProductFormModal
        orders={mockOrders}
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );

    expect(screen.getByText('Новый продукт')).toBeTruthy();
    expect(screen.getByPlaceholderText(/Gigabyte GeForce/i)).toBeTruthy();
  });

  it('populates fields in edit mode and submits updated values', async () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn().mockResolvedValue(undefined);

    renderWithStore(
      <ProductFormModal
        product={mockProduct}
        orders={mockOrders}
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );

    expect(screen.getByText('Редактировать продукт')).toBeTruthy();
    const titleInput = screen.getByDisplayValue('Dell UltraSharp 32');
    expect(titleInput).toBeTruthy();

    fireEvent.change(titleInput, { target: { value: 'Dell UltraSharp 32 OLED 4K' } });
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('closes on cancel button click', () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn();

    renderWithStore(
      <ProductFormModal
        orders={mockOrders}
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );

    fireEvent.click(screen.getByText('ОТМЕНИТЬ'));
    expect(handleClose).toHaveBeenCalled();
  });
});
