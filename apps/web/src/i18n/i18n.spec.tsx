import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import uiReducer, { setLanguage } from '../store/slices/ui-slice';
import authReducer from '../store/slices/auth-slice';
import sessionReducer from '../store/slices/session-slice';
import { NavigationMenu } from '../components/navigation-menu';
import { TopMenu } from '../components/top-menu';
import { getTranslations, dictionaries, formatProductType } from './index';

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

  it('switches language directly via TopMenu language buttons and updates document lang attributes for Zakon font activation', () => {
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
    expect(document.documentElement.lang).toBe('uk');
    expect(document.documentElement.dataset.lang).toBe('ua');

    const enBtn = screen.getByRole('button', { name: 'EN' });
    fireEvent.click(enBtn);

    expect(store.getState().ui.language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dataset.lang).toBe('en');

    const ruBtn = screen.getByRole('button', { name: 'RU' });
    fireEvent.click(ruBtn);

    expect(store.getState().ui.language).toBe('ru');
    expect(document.documentElement.lang).toBe('ru');
    expect(document.documentElement.dataset.lang).toBe('ru');
  });

  describe('Product Types i18n & formatProductType', () => {
    it('translates canonical product types across UA, RU, and EN correctly', () => {
      // English
      expect(formatProductType('Monitors', 'en')).toBe('Monitors');
      expect(formatProductType('Laptops', 'en')).toBe('Laptops');
      expect(formatProductType('Smartphones', 'en')).toBe('Smartphones');
      expect(formatProductType('Tablets', 'en')).toBe('Tablets');
      expect(formatProductType('Keyboards', 'en')).toBe('Keyboards');

      // Ukrainian
      expect(formatProductType('Monitors', 'ua')).toBe('Монітори');
      expect(formatProductType('Laptops', 'ua')).toBe('Ноутбуки');
      expect(formatProductType('Smartphones', 'ua')).toBe('Смартфони');
      expect(formatProductType('Tablets', 'ua')).toBe('Планшети');
      expect(formatProductType('Keyboards', 'ua')).toBe('Клавіатури');

      // Russian
      expect(formatProductType('Monitors', 'ru')).toBe('Мониторы');
      expect(formatProductType('Laptops', 'ru')).toBe('Ноутбуки');
      expect(formatProductType('Smartphones', 'ru')).toBe('Смартфоны');
      expect(formatProductType('Tablets', 'ru')).toBe('Планшеты');
      expect(formatProductType('Keyboards', 'ru')).toBe('Клавиатуры');
    });

    it('cross-translates types when input is already localized in another language', () => {
      // Input from RU 'Мониторы' -> target UA 'Монітори'
      expect(formatProductType('Мониторы', 'ua')).toBe('Монітори');
      // Input from UA 'Монітори' -> target EN 'Monitors'
      expect(formatProductType('Монітори', 'en')).toBe('Monitors');
      // Input from UA 'Смартфони' -> target RU 'Смартфоны'
      expect(formatProductType('Смартфони', 'ru')).toBe('Смартфоны');
    });

    it('preserves custom user-created types gracefully without crashing', () => {
      expect(formatProductType('VR Headsets', 'ua')).toBe('VR Headsets');
      expect(formatProductType('VR Headsets', 'en')).toBe('VR Headsets');
      expect(formatProductType('', 'ua')).toBe('');
      expect(formatProductType(undefined, 'ua')).toBe('');
    });

    it('includes all type creation and modal strings in dictionaries', () => {
      const langs = ['ru', 'ua', 'en'] as const;
      for (const lang of langs) {
        const p = dictionaries[lang].products;
        expect(p.createTypeAction).toBeTruthy();
        expect(p.createTypeBtn).toBeTruthy();
        expect(p.createTypeTooltip).toBeTruthy();
        expect(p.createTypeModalTitle).toBeTruthy();
        expect(p.typeNameLabel).toBeTruthy();
        expect(p.typeNamePlaceholder).toBeTruthy();
        expect(p.typeInputPlaceholder).toBeTruthy();
        expect(p.typeEmptyError).toBeTruthy();
        expect(p.typeCreateError).toBeTruthy();
      }
    });
  });
});
