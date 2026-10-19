import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from '../../store/slices/ui-slice';
import { OrderFormModal } from './index';

function renderWithStore(ui: React.ReactElement) {
  const store = configureStore({
    reducer: {
      ui: uiReducer,
    },
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('OrderFormModal Component', () => {
  const mockOrder = {
    id: 'ord-123',
    title: 'Партія MacBook Pro M3',
    description: '10 ноутбуків для інженерного відділу',
    location: 'Склад №2 (Львів)',
    createdAt: '2026-03-01T10:00:00.000Z',
    productsCount: 10,
    totalPrices: [],
  };

  it('renders create order mode when order is null', () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn().mockResolvedValue(undefined);

    renderWithStore(
      <OrderFormModal
        order={null}
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );

    expect(screen.getByText('Новый приход')).toBeTruthy();
    expect(screen.getByPlaceholderText('Приход #1 Samsung & Apple')).toBeTruthy();
  });

  it('populates fields in edit mode and submits updated values', async () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn().mockResolvedValue(undefined);

    renderWithStore(
      <OrderFormModal
        order={mockOrder}
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );

    expect(screen.getByText('Редактировать приход')).toBeTruthy();
    const input = screen.getByDisplayValue('Партія MacBook Pro M3');
    expect(input).toBeTruthy();

    fireEvent.change(input, { target: { value: 'Оновлена партія MacBook' } });
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Оновлена партія MacBook',
        description: '10 ноутбуків для інженерного відділу',
        location: 'Склад №2 (Львів)',
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('validates empty title and does not submit', async () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn();

    renderWithStore(
      <OrderFormModal
        order={null}
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );

    const input = screen.getByPlaceholderText('Приход #1 Samsung & Apple');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));

    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
