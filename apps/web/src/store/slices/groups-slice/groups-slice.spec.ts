import groupsReducer, {
  setGroupToDelete,
  setGroupToEdit,
  onGroupCreatedWs,
  onGroupUpdatedWs,
  onGroupDeletedWs,
  GroupsState,
} from './index';
import { Group } from '@dzencode/contracts';

describe('Groups Slice', () => {
  const initialState: GroupsState = {
    items: [],
    groupToDelete: null,
    groupToEdit: null,
    loading: false,
    error: null,
  };

  const mockGroup: Group = {
    id: 'grp-1',
    title: 'Монітори та дисплеї',
    description: 'Група моніторів',
    productsCount: 5,
  };

  it('sets and clears groupToDelete', () => {
    let state = groupsReducer(initialState, setGroupToDelete(mockGroup));
    expect(state.groupToDelete).toEqual(mockGroup);

    state = groupsReducer(state, setGroupToDelete(null));
    expect(state.groupToDelete).toBeNull();
  });

  it('sets and clears groupToEdit', () => {
    let state = groupsReducer(initialState, setGroupToEdit(mockGroup));
    expect(state.groupToEdit).toEqual(mockGroup);

    state = groupsReducer(state, setGroupToEdit(null));
    expect(state.groupToEdit).toBeNull();
  });

  it('handles onGroupCreatedWs without duplicating', () => {
    let state = groupsReducer(initialState, onGroupCreatedWs(mockGroup));
    expect(state.items).toHaveLength(1);
    expect(state.items[0]).toEqual(mockGroup);

    // Duplicate event
    state = groupsReducer(state, onGroupCreatedWs(mockGroup));
    expect(state.items).toHaveLength(1);
  });

  it('handles onGroupUpdatedWs', () => {
    const stateWithGroup: GroupsState = {
      ...initialState,
      items: [mockGroup],
    };

    const updatedGroup: Group = {
      ...mockGroup,
      title: 'Оновлена назва моніторів',
    };

    const nextState = groupsReducer(stateWithGroup, onGroupUpdatedWs(updatedGroup));
    expect(nextState.items[0].title).toBe('Оновлена назва моніторів');
  });

  it('handles onGroupDeletedWs', () => {
    const stateWithGroup: GroupsState = {
      ...initialState,
      items: [mockGroup],
      groupToDelete: mockGroup,
      groupToEdit: mockGroup,
    };

    const nextState = groupsReducer(stateWithGroup, onGroupDeletedWs('grp-1'));
    expect(nextState.items).toHaveLength(0);
    expect(nextState.groupToDelete).toBeNull();
    expect(nextState.groupToEdit).toBeNull();
  });
});
