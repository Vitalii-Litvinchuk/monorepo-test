import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from '../../store/slices/ui-slice';
import { GroupFormModal } from './index';

function renderWithStore(ui: React.ReactElement) {
  const store = configureStore({
    reducer: {
      ui: uiReducer,
    },
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('GroupFormModal Component', () => {
  const mockGroup = {
    id: 'grp-123',
    title: 'Монітори LG та Dell',
    description: 'Офісні дисплеї 27 дюймів',
    productsCount: 12,
  };

  it('renders create group modal when group is null', () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn().mockResolvedValue(undefined);

    renderWithStore(
      <GroupFormModal
        group={null}
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );

    expect(screen.getByRole('heading', { level: 3 })).toBeTruthy();
    expect(screen.getByPlaceholderText('Введите название группы...')).toBeTruthy();
  });

  it('populates fields in edit mode and submits updated values', async () => {
    const handleClose = jest.fn();
    const handleSubmit = jest.fn().mockResolvedValue(undefined);

    renderWithStore(
      <GroupFormModal
        group={mockGroup}
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );

    const titleInput = screen.getByDisplayValue('Монітори LG та Dell');
    expect(titleInput).toBeTruthy();

    fireEvent.change(titleInput, { target: { value: 'Монітори UltraWide' } });

    const submitBtn = screen.getByRole('button', { name: /сохранить|зберегти|save/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        title: 'Монітори UltraWide',
        description: 'Офісні дисплеї 27 дюймів',
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
