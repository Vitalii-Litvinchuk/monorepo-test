import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Product,
  ProductFilterQuery,
  CreateProductDto,
  UpdateProductDto,
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
  productToEdit: Product | null;
  productToDelete: Product | null;
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
  productToEdit: null,
  productToDelete: null,
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

export const createProductType = createAsyncThunk(
  'products/createType',
  async (type: string) => {
    return await apiClient.createProductType(type);
  },
);

export const fetchProductSpecifications = createAsyncThunk(
  'products/fetchSpecifications',
  async () => {
    return await apiClient.getProductSpecifications();
  },
);

export const createProductSpecification = createAsyncThunk(
  'products/createSpecification',
  async (specification: string) => {
    return await apiClient.createProductSpecification(specification);
  },
);

export const createProduct = createAsyncThunk(
  'products/create',
  async (dto: CreateProductDto) => {
    return await apiClient.createProduct(dto);
  },
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, dto }: { id: string; dto: UpdateProductDto }) => {
    return await apiClient.updateProduct(id, dto);
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
    setProductToEdit: (state, action: PayloadAction<Product | null>) => {
      state.productToEdit = action.payload;
    },
    setProductToDelete: (state, action: PayloadAction<Product | null>) => {
      state.productToDelete = action.payload;
    },
    onProductCreatedWs: (state, action: PayloadAction<Product>) => {
      if (!state.items.find((p) => p.id === action.payload.id)) {
        state.items.unshift(action.payload);
      }
    },
    onProductDeletedWs: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
      if (state.productToEdit?.id === action.payload) {
        state.productToEdit = null;
      }
      if (state.productToDelete?.id === action.payload) {
        state.productToDelete = null;
      }
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
      .addCase(createProductType.fulfilled, (state, action) => {
        state.types = action.payload;
        state.selectedType = action.meta.arg;
      })
      .addCase(fetchProductSpecifications.fulfilled, (state, action) => {
        state.specifications = action.payload;
      })
      .addCase(createProductSpecification.fulfilled, (state, action) => {
        state.specifications = action.payload;
        state.selectedSpecification = action.meta.arg;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        if (!state.items.find((p) => p.id === action.payload.id)) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], ...action.payload };
        }
        state.productToEdit = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
        state.productToDelete = null;
      });
  },
});

export const {
  setSelectedType,
  setSelectedSpecification,
  setSearchQuery,
  setProductToEdit,
  setProductToDelete,
  onProductCreatedWs,
  onProductDeletedWs,
} = productsSlice.actions;
export default productsSlice.reducer;
