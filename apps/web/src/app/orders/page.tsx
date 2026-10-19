'use client';

import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchOrders,
  selectOrder,
  setOrderToDelete,
  deleteOrder,
  createOrder,
} from '../../store/slices/orders-slice';
import { OrderCard } from '../../components/order-card';
import { OrderDetailPanel } from '../../components/order-detail-panel';
import { DeleteConfirmModal } from '../../components/delete-confirm-modal';
import { Order } from '@dzencode/contracts';

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { items: orders, selectedOrderId, orderToDelete, loading } = useAppSelector(
    (state) => state.orders,
  );
  const globalSearch = useAppSelector((state) => state.ui.globalSearch);

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);
  const isSplitView = Boolean(selectedOrder);

  // Filter by global search input
  const filteredOrders = orders.filter((o) => {
    if (!globalSearch.trim()) return true;
    return o.title.toLowerCase().includes(globalSearch.toLowerCase().trim());
  });

  const handleSelectOrder = (id: string) => {
    if (selectedOrderId === id) {
      dispatch(selectOrder(null));
    } else {
      dispatch(selectOrder(id));
    }
  };

  const handleCloseDetail = () => {
    dispatch(selectOrder(null));
  };

  const handleOpenDelete = (order: Order) => {
    dispatch(setOrderToDelete(order));
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteOrder(orderToDelete.id)).unwrap();
    } catch (err) {
      console.error('Failed to delete order:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddOrder = async () => {
    const title = prompt('Введите название нового прихода:');
    if (title && title.trim()) {
      await dispatch(createOrder({ title: title.trim() }));
      dispatch(fetchOrders());
    }
  };

  return (
    <div>
      {/* Header with green + button and title */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '36px',
        }}
      >
        <button
          type="button"
          onClick={handleAddOrder}
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
            transition: 'transform 0.15s',
          }}
          title="Добавить новый приход"
        >
          <Plus size={20} />
        </button>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Приходы / {orders.length}
        </h1>
      </div>

      {/* Main content: Either full-width list or Master-Detail Split View */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: isSplitView ? 16 : 0,
          transition: 'all 0.3s ease',
        }}
      >
        {/* Left column: Orders list */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: isSplitView ? 467 : 1434,
            maxWidth: '100%',
            flexShrink: 0,
            transition: 'width 0.3s ease',
          }}
        >
          {loading && orders.length === 0 && (
            <div style={{ padding: 24, color: '#90a4ae' }}>Загрузка приходов...</div>
          )}

          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isCompact={isSplitView}
              isActive={selectedOrderId === order.id}
              onSelect={handleSelectOrder}
              onDeleteClick={handleOpenDelete}
            />
          ))}

          {!loading && filteredOrders.length === 0 && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cfd8dc',
                borderRadius: 4,
                padding: 32,
                textAlign: 'center',
                color: '#90a4ae',
              }}
            >
              Приходов не найдено. Нажмите +, чтобы добавить новый приход.
            </div>
          )}
        </div>

        {/* Right column: Detail Panel */}
        {isSplitView && selectedOrder && (
          <OrderDetailPanel
            order={selectedOrder}
            onClose={handleCloseDetail}
            onAddProduct={() => {
              alert('Используйте API или форму для добавления продуктов в этот приход.');
            }}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        order={orderToDelete}
        isOpen={Boolean(orderToDelete)}
        onClose={() => dispatch(setOrderToDelete(null))}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}
