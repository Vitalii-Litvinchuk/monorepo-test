import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ProductTableViewMode = 'optimized-grid' | 'classic-scroll';
export type Language = 'ru' | 'ua' | 'en';

export interface UiState {
  productTableViewMode: ProductTableViewMode;
  language: Language;
  sidebarOpen: boolean;
  globalSearch: string;
}

const initialState: UiState = {
  productTableViewMode: 'optimized-grid', // Default best-practice view (no 2542px scroll)
  language: 'ru',
  sidebarOpen: true,
  globalSearch: '',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setProductTableViewMode: (state, action: PayloadAction<ProductTableViewMode>) => {
      state.productTableViewMode = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('products_view_mode', action.payload);
      }
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_language', action.payload);
      }
    },
    setGlobalSearch: (state, action: PayloadAction<string>) => {
      state.globalSearch = action.payload;
    },
  },
});

export const { setProductTableViewMode, setLanguage, setGlobalSearch } = uiSlice.actions;
export default uiSlice.reducer;
