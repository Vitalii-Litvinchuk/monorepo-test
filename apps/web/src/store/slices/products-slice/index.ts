import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Product,
  ProductFilterQuery,
  CreateProductDto,
} from '@dzencode/contracts';
import { apiClient } from '../../../services/api-client';

export interface ProductsState {
  items: Product[];
  types: string[];
  specifications: string[];
  filter: ProductFilterQuery;
  selectedType: string;
  selectedSpecification: string;
  searchQuery: string;
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  types: [],
  specifications: [],
  filter: {},
  selectedType: 'all',
  selectedSpecification: 'all',
  searchQuery: '',
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchAll',
  async (filter?: ProductFilterQuery) => {
    return await apiClient.getProducts(filter);
  },
);

export const fetchProductTypes = createAsyncThunk(
  'products/fetchTypes',
  async () => {
    return await apiClient.getProductTypes();
  },
);

export const fetchProductSpecifications = createAsyncThunk(
  'products/fetchSpecifications',
  async () => {
    return await apiClient.getProductSpecifications();
  },
);

export const createProduct = createAsyncThunk(
  'products/create',
  async (dto: CreateProductDto) => {
    return await apiClient.createProduct(dto);
  },
);

export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id: string) => {
    await apiClient.deleteProduct(id);
    return id;
  },
);

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSelectedType: (state, action: PayloadAction<string>) => {
      state.selectedType = action.payload;
    },
    setSelectedSpecification: (state, action: PayloadAction<string>) => {
      state.selectedSpecification = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    onProductCreatedWs: (state, action: PayloadAction<Product>) => {
      if (!state.items.find((p) => p.id === action.payload.id)) {
        state.items.unshift(action.payload);
      }
    },
    onProductDeletedWs: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      .addCase(fetchProductTypes.fulfilled, (state, action) => {
        state.types = action.payload;
      })
      .addCase(fetchProductSpecifications.fulfilled, (state, action) => {
        state.specifications = action.payload;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        if (!state.items.find((p) => p.id === action.payload.id)) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export const {
  setSelectedType,
  setSelectedSpecification,
  setSearchQuery,
  onProductCreatedWs,
  onProductDeletedWs,
} = productsSlice.actions;
export default productsSlice.reducer;
