import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '@dzencode/contracts';
import { apiClient } from '../../../services/api-client';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
};

export const demoLoginThunk = createAsyncThunk(
  'auth/demoLogin',
  async (email?: string) => {
    return await apiClient.demoLogin(email);
  },
);

export const checkAuthThunk = createAsyncThunk('auth/checkAuth', async () => {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('auth_token');
  if (token) {
    try {
      const user = await apiClient.getMe();
      return { user, token };
    } catch {
      apiClient.logout();
    }
  }
  // Auto-authenticate so users can immediately create products, orders and groups
  try {
    const demo = await apiClient.demoLogin();
    return { user: demo.user, token: demo.accessToken };
  } catch {
    return null;
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthToken: (
      state,
      action: PayloadAction<{ token: string; user?: User }>,
    ) => {
      state.token = action.payload.token;
      state.isAuthenticated = true;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', action.payload.token);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      apiClient.logout();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(demoLoginThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(checkAuthThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      });
  },
});

export const { setAuthToken, logout } = authSlice.actions;
export default authSlice.reducer;
