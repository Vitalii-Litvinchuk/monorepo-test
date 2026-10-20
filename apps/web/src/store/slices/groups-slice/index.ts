import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Group, CreateGroupDto, UpdateGroupDto } from '@dzencode/contracts';
import { apiClient } from '../../../services/api-client';

export interface GroupsState {
  items: Group[];
  groupToDelete: Group | null;
  groupToEdit: Group | null;
  loading: boolean;
  error: string | null;
}

const initialState: GroupsState = {
  items: [],
  groupToDelete: null,
  groupToEdit: null,
  loading: false,
  error: null,
};

export const fetchGroups = createAsyncThunk('groups/fetchAll', async () => {
  return await apiClient.getGroups();
});

export const createGroup = createAsyncThunk(
  'groups/create',
  async (dto: CreateGroupDto) => {
    return await apiClient.createGroup(dto);
  },
);

export const updateGroup = createAsyncThunk(
  'groups/update',
  async ({ id, dto }: { id: string; dto: UpdateGroupDto }) => {
    return await apiClient.updateGroup(id, dto);
  },
);

export const deleteGroup = createAsyncThunk(
  'groups/delete',
  async (id: string) => {
    await apiClient.deleteGroup(id);
    return id;
  },
);

export const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setGroupToDelete: (state, action: PayloadAction<Group | null>) => {
      state.groupToDelete = action.payload;
    },
    setGroupToEdit: (state, action: PayloadAction<Group | null>) => {
      state.groupToEdit = action.payload;
    },
    onGroupCreatedWs: (state, action: PayloadAction<Group>) => {
      if (!state.items.find((g) => g.id === action.payload.id)) {
        state.items.unshift(action.payload);
      }
    },
    onGroupUpdatedWs: (state, action: PayloadAction<Group>) => {
      const idx = state.items.findIndex((g) => g.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    },
    onGroupDeletedWs: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((g) => g.id !== action.payload);
      if (state.groupToDelete?.id === action.payload) {
        state.groupToDelete = null;
      }
      if (state.groupToEdit?.id === action.payload) {
        state.groupToEdit = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch groups';
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        const exists = state.items.some((g) => g.id === action.payload.id);
        if (!exists) {
          state.items.unshift(action.payload);
        }
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        const idx = state.items.findIndex((g) => g.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = action.payload;
        }
      })
      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.items = state.items.filter((g) => g.id !== action.payload);
      });
  },
});

export const {
  setGroupToDelete,
  setGroupToEdit,
  onGroupCreatedWs,
  onGroupUpdatedWs,
  onGroupDeletedWs,
} = groupsSlice.actions;

export default groupsSlice.reducer;
