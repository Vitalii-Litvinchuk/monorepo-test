import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import ordersReducer from './slices/orders-slice';
import productsReducer from './slices/products-slice';
import groupsReducer from './slices/groups-slice';
import sessionReducer from './slices/session-slice';
import authReducer from './slices/auth-slice';
import uiReducer from './slices/ui-slice';

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    products: productsReducer,
    groups: groupsReducer,
    session: sessionReducer,
    auth: authReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
