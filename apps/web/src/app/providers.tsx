'use client';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { checkAuthThunk } from '../store/slices/auth-slice';

export const Providers: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    store.dispatch(checkAuthThunk());
  }, []);

  return <Provider store={store}>{children}</Provider>;
};
