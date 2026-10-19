import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SessionState {
  activeSessionsCount: number;
  lastUpdated: string;
}

const initialState: SessionState = {
  activeSessionsCount: 1,
  lastUpdated: '',
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setActiveSessionsCount: (state, action: PayloadAction<number>) => {
      state.activeSessionsCount = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
  },
});

export const { setActiveSessionsCount } = sessionSlice.actions;
export default sessionSlice.reducer;
