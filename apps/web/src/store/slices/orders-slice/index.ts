import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Order, CreateOrderDto, UpdateOrderDto } from '@dzencode/contracts';
import { apiClient } from '../../../services/api-client';

export interface OrdersState {
  items: Order[];
  selectedOrderId: string | null;
  orderToDelete: Order | null;
  orderToEdit: Order | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  items: [],
  selectedOrderId: null,
  orderToDelete: null,
  orderToEdit: null,
  loading: false,
  error: null,
};

export const fetchOrders = createAsyncThunk('orders/fetchAll', async () => {
  return await apiClient.getOrders();
});

export const createOrder = createAsyncThunk(
  'orders/create',
  async (dto: CreateOrderDto) => {
    return await apiClient.createOrder(dto);
  },
);

export const updateOrder = createAsyncThunk(
  'orders/update',
  async ({ id, dto }: { id: string; dto: UpdateOrderDto }) => {
    return await apiClient.updateOrder(id, dto);
  },
);

export const deleteOrder = createAsyncThunk(
  'orders/delete',
  async (id: string) => {
    await apiClient.deleteOrder(id);
    return id;
  },
);

export const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    selectOrder: (state, action: PayloadAction<string | null>) => {
      state.selectedOrderId = action.payload;
    },
    setOrderToDelete: (state, action: PayloadAction<Order | null>) => {
      state.orderToDelete = action.payload;
    },
    setOrderToEdit: (state, action: PayloadAction<Order | null>) => {
      state.orderToEdit = action.payload;
    },
    // WebSocket real-time event updates
    onOrderCreatedWs: (state, action: PayloadAction<Order>) => {
      if (!state.items.find((o) => o.id === action.payload.id)) {
        state.items.unshift(action.payload);
      }
    },
    onOrderDeletedWs: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((o) => o.id !== action.payload);
      if (state.selectedOrderId === action.payload) {
        state.selectedOrderId = null;
      }
      if (state.orderToDelete?.id === action.payload) {
        state.orderToDelete = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch orders';
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        if (!state.items.find((o) => o.id === action.payload.id)) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        const idx = state.items.findIndex((o) => o.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], ...action.payload };
        }
        state.orderToEdit = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.items = state.items.filter((o) => o.id !== action.payload);
        if (state.selectedOrderId === action.payload) {
          state.selectedOrderId = null;
        }
        state.orderToDelete = null;
      });
  },
});

export const {
  selectOrder,
  setOrderToDelete,
  setOrderToEdit,
  onOrderCreatedWs,
  onOrderDeletedWs,
} = ordersSlice.actions;
export default ordersSlice.reducer;
