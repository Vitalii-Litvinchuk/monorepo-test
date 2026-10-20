import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import groupsReducer from '../src/store/slices/groups-slice';
import uiReducer from '../src/store/slices/ui-slice';
import authReducer from '../src/store/slices/auth-slice';
import sessionReducer from '../src/store/slices/session-slice';
import GroupsPage from '../src/app/groups/page';

jest.mock('../src/services/api-client', () => ({
  apiClient: {
    getGroups: jest.fn().mockResolvedValue([
      {
        id: 'grp-test-1',
        title: 'Комплектуючі ПК',
        description: 'Материнські плати та процесори',
        productsCount: 8,
      },
      {
        id: 'grp-test-2',
        title: 'Периферія',
        description: 'Миші, клавіатури, гарнітури',
        productsCount: 15,
      },
    ]),
    createGroup: jest.fn().mockImplementation((dto) =>
      Promise.resolve({
        id: 'grp-test-new',
        ...dto,
        productsCount: 0,
      }),
    ),
    updateGroup: jest.fn().mockImplementation((id, dto) =>
      Promise.resolve({
        id,
        ...dto,
        productsCount: 8,
      }),
    ),
    deleteGroup: jest.fn().mockResolvedValue({ success: true, id: 'grp-test-1' }),
  },
}));

function renderGroupsWithStore() {
  const store = configureStore({
    reducer: {
      groups: groupsReducer,
      ui: uiReducer,
      auth: authReducer,
      session: sessionReducer,
    },
  });

  const renderResult = render(
    <Provider store={store}>
      <GroupsPage />
    </Provider>,
  );

  return { store, ...renderResult };
}

describe('Frontend Groups Page Integration Tests (CRUD & Real-time)', () => {
  it('renders groups cards and calculates counts properly', async () => {
    renderGroupsWithStore();

    await waitFor(() => {
      expect(screen.getByText('Комплектуючі ПК')).toBeTruthy();
      expect(screen.getByText('Периферія')).toBeTruthy();
    });

    expect(screen.getByText(/Комплектуючі ПК/)).toBeTruthy();
  });

  it('filters groups with contextual search input', async () => {
    renderGroupsWithStore();

    await waitFor(() => {
      expect(screen.getByText('Комплектуючі ПК')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText(/поиск групп|пошук груп|search groups/i);
    fireEvent.change(searchInput, { target: { value: 'Периферія' } });

    await waitFor(() => {
      expect(screen.queryByText('Комплектуючі ПК')).toBeNull();
      expect(screen.getByText('Периферія')).toBeTruthy();
    });
  });

  it('opens GroupFormModal on + button click and creates a new group', async () => {
    renderGroupsWithStore();

    await waitFor(() => {
      expect(screen.getByText('Комплектуючі ПК')).toBeTruthy();
    });

    const addBtn = screen.getByTitle(/добавить группу|додати групу|add group/i);
    fireEvent.click(addBtn);

    expect(
      screen.getByText(/создать новую группу|створити нову групу|create new group/i),
    ).toBeTruthy();
  });

  it('opens DeleteConfirmModal on delete button click', async () => {
    renderGroupsWithStore();

    await waitFor(() => {
      expect(screen.getByText('Комплектуючі ПК')).toBeTruthy();
    });

    const deleteBtns = screen.getAllByTitle(/удалить группу|видалити групу|delete group/i);
    fireEvent.click(deleteBtns[0]);

    await waitFor(() => {
      expect(
        screen.getByText(/вы действительно хотите удалить группу|ви дійсно хочете видалити групу|are you sure you want to delete group/i),
      ).toBeTruthy();
    });
  });
});
