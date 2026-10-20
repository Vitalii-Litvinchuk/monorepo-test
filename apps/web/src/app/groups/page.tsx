'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Folder, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  setGroupToDelete,
  setGroupToEdit,
  onGroupCreatedWs,
  onGroupUpdatedWs,
  onGroupDeletedWs,
} from '../../store/slices/groups-slice';
import { GroupFormModal } from '../../components/group-form-modal';
import { DeleteConfirmModal } from '../../components/delete-confirm-modal';
import { Tooltip } from '../../components/tooltip';
import { useDebounce } from '../../utils/use-debounce';
import { getSocketClient } from '../../services/socket-client';
import { WS_EVENTS } from '@dzencode/contracts';
import { useTranslation } from '../../i18n';

export default function GroupsPage() {
  const dispatch = useAppDispatch();
  const { items: groups, groupToDelete, groupToEdit, loading } = useAppSelector(
    (state) => state.groups,
  );
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  // Real-time WebSocket updates
  useEffect(() => {
    const socket = getSocketClient();
    if (!socket) return;

    const handleCreated = (g: any) => dispatch(onGroupCreatedWs(g));
    const handleUpdated = (g: any) => dispatch(onGroupUpdatedWs(g));
    const handleDeleted = (data: { id: string }) => dispatch(onGroupDeletedWs(data.id));

    socket.on(WS_EVENTS.GROUP_CREATED, handleCreated);
    socket.on(WS_EVENTS.GROUP_UPDATED, handleUpdated);
    socket.on(WS_EVENTS.GROUP_DELETED, handleDeleted);

    return () => {
      socket.off(WS_EVENTS.GROUP_CREATED, handleCreated);
      socket.off(WS_EVENTS.GROUP_UPDATED, handleUpdated);
      socket.off(WS_EVENTS.GROUP_DELETED, handleDeleted);
    };
  }, [dispatch]);

  const filteredGroups = useMemo(() => {
    if (!debouncedSearch.trim()) return groups;
    const q = debouncedSearch.toLowerCase().trim();
    return groups.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q)),
    );
  }, [groups, debouncedSearch]);

  const handleOpenCreate = () => {
    dispatch(setGroupToEdit(null));
    setIsFormOpen(true);
  };

  const handleOpenEdit = (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setGroupToEdit(group));
    setIsFormOpen(true);
  };

  const handleOpenDelete = (group: any, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setGroupToDelete(group));
  };

  const handleSaveGroup = async (data: { title: string; description?: string }) => {
    if (groupToEdit) {
      await dispatch(updateGroup({ id: groupToEdit.id, dto: data })).unwrap();
    } else {
      await dispatch(createGroup(data)).unwrap();
    }
    dispatch(fetchGroups());
  };

  const handleConfirmDelete = async () => {
    if (!groupToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteGroup(groupToDelete.id)).unwrap();
      dispatch(fetchGroups());
      dispatch(setGroupToDelete(null));
    } catch (err) {
      console.error('Failed to delete group:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1434 }}>
      {/* Top Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        <Tooltip content={t.groups.addGroup}>
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'var(--color-brand-primary)',
              boxShadow: '0 0 0 4px rgba(139, 195, 74, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            title={t.groups.addGroup}
          >
            <Plus size={20} strokeWidth={2.8} />
          </button>
        </Tooltip>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: 0,
            letterSpacing: '-0.3px',
          }}
        >
          {t.groups.title} / {filteredGroups.length}
        </h1>

        <div style={{ marginLeft: 'auto', position: 'relative', minWidth: 260 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#90a4ae',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.groups.searchPlaceholder}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: 20,
              border: '1px solid #cfd8dc',
              background: '#ffffff',
              fontSize: 13,
              color: 'var(--color-text-primary)',
              outline: 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          />
        </div>
      </div>

      {/* Content Area */}
      {loading && groups.length === 0 ? (
        <div style={{ color: '#90a4ae', padding: '24px 0' }}>{t.groups.loading}</div>
      ) : filteredGroups.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: 'center',
            color: '#90a4ae',
            background: '#ffffff',
            borderRadius: 6,
            border: '1px solid #e0e0e0',
          }}
        >
          {t.groups.empty}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 16,
          }}
        >
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              style={{
                background: '#ffffff',
                border: '1px solid #cfd8dc',
                borderRadius: 4,
                padding: '22px 24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 4,
                      background: '#f0f3f5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#546e7a',
                      flexShrink: 0,
                    }}
                  >
                    <Folder size={20} />
                  </div>
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#2c3c44',
                      margin: 0,
                      wordBreak: 'break-word',
                    }}
                  >
                    {group.title}
                  </h3>
                </div>

                {/* Card Actions: Edit & Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tooltip content={t.groups.editGroup}>
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(group, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#90a4ae',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={t.groups.editGroup}
                    >
                      <Pencil size={15} />
                    </button>
                  </Tooltip>

                  <Tooltip content={t.groups.deleteGroup}>
                    <button
                      type="button"
                      onClick={(e) => handleOpenDelete(group, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#90a4ae',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      title={t.groups.deleteGroup}
                    >
                      <Trash2 size={15} />
                    </button>
                  </Tooltip>
                </div>
              </div>

              <p
                style={{
                  fontSize: 13,
                  color: '#546e7a',
                  margin: 0,
                  minHeight: 38,
                  lineHeight: '1.4',
                }}
              >
                {group.description || '—'}
              </p>

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 12,
                  borderTop: '1px solid #eaeff2',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#8bc34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>
                  {t.groups.productsInGroup} {group.productsCount}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Create/Edit Modal */}
      <GroupFormModal
        group={groupToEdit}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          dispatch(setGroupToEdit(null));
        }}
        onSubmit={handleSaveGroup}
      />

      {/* Group Delete Confirm Modal */}
      <DeleteConfirmModal
        group={groupToDelete}
        isOpen={Boolean(groupToDelete)}
        onClose={() => dispatch(setGroupToDelete(null))}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}
