'use client';

import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import styles from './order-detail-panel.module.scss';
import { Order, ProductOperationalStatus } from '@dzencode/contracts';
import { useAppDispatch } from '../../store';
import { deleteProduct } from '../../store/slices/products-slice';
import { fetchOrders } from '../../store/slices/orders-slice';

interface OrderDetailPanelProps {
  order: Order;
  onClose: () => void;
  onAddProduct?: () => void;
}

export const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({
  order,
  onClose,
  onAddProduct,
}) => {
  const dispatch = useAppDispatch();
  const products = order.products || [];

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Удалить этот продукт из прихода?')) {
      await dispatch(deleteProduct(productId));
      dispatch(fetchOrders());
    }
  };

  return (
    <div className={styles.panel}>
      <button
        type="button"
        className={styles.closeButton}
        onClick={onClose}
        title="Закрыть панель деталей"
      >
        <X size={18} />
      </button>

      <div className={styles.panelHeader}>
        <h2 className={styles.orderTitle}>{order.title}</h2>
        <button
          type="button"
          className={styles.addProductBtn}
          onClick={onAddProduct}
        >
          <span className={styles.plusCircle}>
            <Plus size={14} />
          </span>
          Добавить продукт
        </button>
      </div>

      <div className={styles.productsList}>
        {products.map((product) => {
          const isRepair = product.operationalStatus === ProductOperationalStatus.IN_REPAIR;
          const statusText = isRepair ? 'В ремонте' : 'Свободен';
          const statusClass = isRepair ? styles.repair : styles.available;

          return (
            <div key={product.id} className={styles.productRow}>
              <span className={`${styles.statusDot} ${statusClass}`} />

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/static/${product.photo}`}
                alt={product.title}
                className={styles.productPhoto}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              <div className={styles.titleAndSn}>
                <span className={styles.productTitle} title={product.title}>
                  {product.title}
                </span>
                <span className={styles.serialNumber}>
                  SN-{product.serialNumber}
                </span>
              </div>

              <span className={`${styles.statusText} ${statusClass}`}>
                {statusText}
              </span>

              <button
                type="button"
                className={styles.deleteProductBtn}
                onClick={() => handleDeleteProduct(product.id)}
                title="Удалить продукт"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}

        {products.length === 0 && (
          <div style={{ padding: '34px', color: '#90a4ae', fontSize: '14px' }}>
            В этом приходе пока нет продуктов.
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPanel;
