import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import uiReducer, { setLanguage } from '../store/slices/ui-slice';
import authReducer from '../store/slices/auth-slice';
import sessionReducer from '../store/slices/session-slice';
import { NavigationMenu } from '../components/navigation-menu';
import { TopMenu } from '../components/top-menu';
import { getTranslations, dictionaries } from './index';

describe('i18n System Tests', () => {
  it('has consistent and complete keys across ru, ua, and en dictionaries', () => {
    const langs = ['ru', 'ua', 'en'] as const;
    for (const lang of langs) {
      const t = dictionaries[lang];
      expect(t.nav.orders).toBeTruthy();
      expect(t.nav.products).toBeTruthy();
      expect(t.topMenu.searchPlaceholder).toBeTruthy();
      expect(t.topMenu.daysOfWeek.length).toBe(7);
      expect(t.topMenu.months.length).toBe(12);
      expect(t.orders.title).toBeTruthy();
      expect(t.products.title).toBeTruthy();
      expect(t.settings.title).toBeTruthy();
    }
  });

  it('correctly returns localized dictionaries via getTranslations', () => {
    expect(getTranslations('ru').nav.orders).toBe('ПРИХОД');
    expect(getTranslations('ua').nav.orders).toBe('ПРИХОДИ');
    expect(getTranslations('en').nav.orders).toBe('ORDERS');

    expect(getTranslations('ua').products.title).toBe('Продукти');
    expect(getTranslations('en').products.title).toBe('Products');
  });

  it('dynamically translates NavigationMenu when language changes in Redux store', () => {
    const store = configureStore({
      reducer: {
        ui: uiReducer,
        auth: authReducer,
        session: sessionReducer,
      },
    });

    const { rerender } = render(
      <Provider store={store}>
        <NavigationMenu />
      </Provider>,
    );

    // Initial language is Russian
    expect(screen.getByText('ПРИХОД')).toBeTruthy();
    expect(screen.getByText('ПРОДУКТЫ')).toBeTruthy();
    expect(screen.getByText('НАСТРОЙКИ')).toBeTruthy();

    // Switch to Ukrainian
    act(() => {
      store.dispatch(setLanguage('ua'));
    });
    rerender(
      <Provider store={store}>
        <NavigationMenu />
      </Provider>,
    );

    expect(screen.getByText('ПРИХОДИ')).toBeTruthy();
    expect(screen.getByText('ПРОДУКТИ')).toBeTruthy();
    expect(screen.getByText('НАЛАШТУВАННЯ')).toBeTruthy();

    // Switch to English
    act(() => {
      store.dispatch(setLanguage('en'));
    });
    rerender(
      <Provider store={store}>
        <NavigationMenu />
      </Provider>,
    );

    expect(screen.getByText('ORDERS')).toBeTruthy();
    expect(screen.getByText('PRODUCTS')).toBeTruthy();
    expect(screen.getByText('SETTINGS')).toBeTruthy();
  });

  it('switches language directly via TopMenu language buttons', () => {
    const store = configureStore({
      reducer: {
        ui: uiReducer,
        auth: authReducer,
        session: sessionReducer,
      },
    });

    render(
      <Provider store={store}>
        <TopMenu />
      </Provider>,
    );

    const uaBtn = screen.getByRole('button', { name: 'UA' });
    fireEvent.click(uaBtn);

    expect(store.getState().ui.language).toBe('ua');

    const enBtn = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(enBtn);

    expect(store.getState().ui.language).toBe('en');
  });
});
