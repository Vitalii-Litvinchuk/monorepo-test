'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { checkAuthThunk } from '../store/slices/auth-slice';
import { setLanguage, setProductTableViewMode, Language, ProductTableViewMode } from '../store/slices/ui-slice';

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    store.dispatch(checkAuthThunk());

    // Hydrate i18n language preference from localStorage
    try {
      const savedLang = localStorage.getItem('app_language') as Language | null;
      if (savedLang && (savedLang === 'ru' || savedLang === 'ua' || savedLang === 'en')) {
        store.dispatch(setLanguage(savedLang));
        if (typeof document !== 'undefined') {
          document.documentElement.lang = savedLang === 'ua' ? 'uk' : savedLang;
        }
      }

      const savedViewMode = localStorage.getItem('products_view_mode') as ProductTableViewMode | null;
      if (savedViewMode && (savedViewMode === 'optimized-grid' || savedViewMode === 'classic-scroll')) {
        store.dispatch(setProductTableViewMode(savedViewMode));
      }

      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // Ignore SW registration failure in non-HTTPS or test environments
        });
      }
    } catch {
      // Ignore localStorage restrictions
    }
  }, []);

  return <Provider store={store}>{children}</Provider>;
};
