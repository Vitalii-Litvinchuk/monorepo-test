'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchOrders,
  selectOrder,
  setOrderToDelete,
  setOrderToEdit,
  deleteOrder,
  createOrder,
  updateOrder,
} from '../../store/slices/orders-slice';
import {
  createProduct,
  deleteProduct,
  fetchProductTypes,
  fetchProductSpecifications,
} from '../../store/slices/products-slice';
import { fetchGroups } from '../../store/slices/groups-slice';
import { apiClient } from '../../services/api-client';
import { OrderCard } from '../../components/order-card';
import { OrderDetailPanel } from '../../components/order-detail-panel';
import { DeleteConfirmModal } from '../../components/delete-confirm-modal';
import { OrderFormModal } from '../../components/order-form-modal';
import { ProductFormModal } from '../../components/product-form-modal';
import { OrdersSkeletonList } from '../../components/skeleton';
import { useDebounce } from '../../utils/use-debounce';
import { Order, Product, CreateProductDto, User } from '@dzencode/contracts';
import { useTranslation } from '../../i18n';

import { Tooltip } from '../../components/tooltip';

export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { items: orders, selectedOrderId, orderToDelete, orderToEdit, loading } = useAppSelector(
    (state) => state.orders,
  );
  const groups = useAppSelector((state) => state.groups?.items ?? []);
  const { types, specifications } = useAppSelector((state) => state.products);
  const [users, setUsers] = useState<User[]>([]);
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);

  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Product operations inside OrderDetailPanel
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchGroups());
    dispatch(fetchProductTypes());
    dispatch(fetchProductSpecifications());
    apiClient.getUsers().then(setUsers).catch(console.error);
  }, [dispatch]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId),
    [orders, selectedOrderId],
  );
  const isSplitView = Boolean(selectedOrder);

  // Filter orders by debounced local search input
  const filteredOrders = useMemo(() => {
    if (!debouncedSearch.trim()) return orders;
    const term = debouncedSearch.toLowerCase().trim();
    return orders.filter((o) => o.title.toLowerCase().includes(term));
  }, [orders, debouncedSearch]);

  const handleSelectOrder = useCallback(
    (id: string) => {
      if (selectedOrderId === id) {
        dispatch(selectOrder(null));
      } else {
        dispatch(selectOrder(id));
      }
    },
    [dispatch, selectedOrderId],
  );

  const handleCloseDetail = useCallback(() => {
    dispatch(selectOrder(null));
  }, [dispatch]);

  // Order Delete Handlers
  const handleOpenDelete = useCallback(
    (order: Order) => {
      dispatch(setOrderToDelete(order));
    },
    [dispatch],
  );

  const handleConfirmDeleteOrder = useCallback(async () => {
    if (!orderToDelete) return;
    setIsDeletingOrder(true);
    try {
      await dispatch(deleteOrder(orderToDelete.id)).unwrap();
    } catch (err) {
      console.error('Failed to delete order:', err);
    } finally {
      setIsDeletingOrder(false);
    }
  }, [dispatch, orderToDelete]);

  // Order Form (Create & Edit) Handlers
  const handleOpenCreateOrder = () => {
    dispatch(setOrderToEdit(null));
    setIsCreatingOrder(true);
  };

  const handleOpenEditOrder = useCallback(
    (order: Order) => {
      dispatch(setOrderToEdit(order));
      setIsCreatingOrder(true);
    },
    [dispatch],
  );

  const handleSaveOrder = async (data: {
    title: string;
    description?: string;
    location?: string;
  }) => {
    if (orderToEdit) {
      await dispatch(updateOrder({ id: orderToEdit.id, dto: data })).unwrap();
    } else {
      await dispatch(createOrder(data)).unwrap();
    }
    dispatch(fetchOrders());
  };

  // Product Delete Handlers (inside Detail Panel)
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);
    try {
      await dispatch(deleteProduct(productToDelete.id)).unwrap();
      await dispatch(fetchOrders()).unwrap();
      dispatch(fetchGroups());
      setProductToDelete(null);
    } catch (err) {
      console.error('Failed to delete product from order:', err);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // Product Add Handler (inside Detail Panel)
  const handleSaveProduct = async (dto: any) => {
    await dispatch(createProduct(dto as CreateProductDto)).unwrap();
    await dispatch(fetchOrders()).unwrap();
    dispatch(fetchGroups());
  };

  return (
    <div>
      {/* Top Toolbar: + button, Title, and Contextual Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        <Tooltip content={t.orders.addOrder}>
          <button
            type="button"
            onClick={handleOpenCreateOrder}
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
              transition: 'transform 0.15s',
            }}
            title={t.orders.addOrder}
          >
            <Plus size={20} />
          </button>
        </Tooltip>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          {t.orders.title} / {orders.length}
        </h1>

        {/* Contextual Orders Search Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-border-card)',
            borderRadius: 4,
            padding: '0 12px',
            height: 34,
            width: 340,
            maxWidth: '100%',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <Search size={15} style={{ color: '#90a4ae', marginRight: 8, flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.orders.searchPlaceholder}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: 13,
              color: 'var(--color-text-primary)',
              background: 'transparent',
            }}
          />
        </div>
      </div>

      {/* Main content: Full Table or Master-Detail Split View */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: isSplitView ? 16 : 0,
          paddingTop: isSplitView ? 12 : 0,
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
          {/* Table Column Headers (Strict Grid alignment in Full Mode) */}
          {!isSplitView && (
            <div
              style={{
                width: 1434,
                maxWidth: '100%',
                padding: '0 28px 6px',
                display: 'grid',
                gridTemplateColumns: '44px minmax(260px, 1.8fr) 110px 160px 170px 84px',
                gap: 16,
                fontSize: 11,
                fontWeight: 700,
                color: '#90a4ae',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}
            >
              <span />
              <span>{t.orders.colTitle}</span>
              <span>{t.orders.colProducts}</span>
              <span>{t.orders.colDate}</span>
              <span>{t.orders.colTotal}</span>
              <span style={{ textAlign: 'right' }}>{t.orders.colActions}</span>
            </div>
          )}

          {loading && orders.length === 0 && (
            <OrdersSkeletonList count={6} isCompact={isSplitView} />
          )}

          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isCompact={isSplitView}
              isActive={selectedOrderId === order.id}
              onSelect={handleSelectOrder}
              onEditClick={handleOpenEditOrder}
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
              {t.orders.empty}
            </div>
          )}
        </div>

        {/* Right column: Detail Panel */}
        {isSplitView && selectedOrder && (
          <OrderDetailPanel
            order={selectedOrder}
            onClose={handleCloseDetail}
            onAddProduct={() => setIsAddingProduct(true)}
            onDeleteProduct={(prod) => setProductToDelete(prod)}
          />
        )}
      </div>

      {/* Universal Delete Confirmation Modal for Orders */}
      <DeleteConfirmModal
        order={orderToDelete}
        isOpen={Boolean(orderToDelete)}
        onClose={() => dispatch(setOrderToDelete(null))}
        onConfirm={handleConfirmDeleteOrder}
        loading={isDeletingOrder}
      />

      {/* Universal Delete Confirmation Modal for Products inside Order Detail */}
      <DeleteConfirmModal
        product={productToDelete}
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDeleteProduct}
        loading={isDeletingProduct}
      />

      {/* Custom Order Form Modal (Create & Edit) */}
      <OrderFormModal
        order={orderToEdit}
        isOpen={isCreatingOrder}
        onClose={() => {
          setIsCreatingOrder(false);
          dispatch(setOrderToEdit(null));
        }}
        onSubmit={handleSaveOrder}
      />

      {/* Custom Product Form Modal for Order Detail panel */}
      {selectedOrder && (
        <ProductFormModal
          orders={orders}
          groups={groups}
          users={users}
          availableTypes={types}
          availableSpecifications={specifications}
          defaultOrderId={selectedOrder.id}
          isOpen={isAddingProduct}
          onClose={() => setIsAddingProduct(false)}
          onSubmit={handleSaveProduct}
        />
      )}
    </div>
  );
}
