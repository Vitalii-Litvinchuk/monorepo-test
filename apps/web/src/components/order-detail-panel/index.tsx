'use client';

import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import styles from './order-detail-panel.module.scss';
import { Order, Product, ProductOperationalStatus } from '@dzencode/contracts';
import { getStaticUrl } from '../../utils/url';
import { useTranslation } from '../../i18n';
import { Tooltip } from '../tooltip';

interface OrderDetailPanelProps {
  order: Order;
  onClose: () => void;
  onAddProduct?: () => void;
  onDeleteProduct?: (product: Product) => void;
}

export const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({
  order,
  onClose,
  onAddProduct,
  onDeleteProduct,
}) => {
  const { t } = useTranslation();
  const products = order.products || [];

  return (
    <div className={styles.panel}>
      <Tooltip content={t.orders.closeDetail}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          title={t.orders.closeDetail}
        >
          <X size={18} />
        </button>
      </Tooltip>

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
          {t.orders.addProduct}
        </button>
      </div>

      <div className={styles.productsList}>
        {products.map((product) => {
          const isRepair = product.operationalStatus === ProductOperationalStatus.IN_REPAIR;
          const statusText = isRepair ? t.products.statusInRepair : t.products.statusAvailable;
          const statusClass = isRepair ? styles.repair : styles.available;

          return (
            <div key={product.id} className={styles.productRow}>
              <Tooltip content={statusText}>
                <span className={`${styles.statusDot} ${statusClass}`} />
              </Tooltip>

              <div className={styles.photoContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getStaticUrl(product.photo) || '/static/default-product.svg'}
                  alt={product.title}
                  className={styles.productPhoto}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/static/default-product.svg';
                  }}
                />
              </div>

              <Tooltip content={`${product.title} (SN-${product.serialNumber})`}>
                <div className={styles.titleAndSn}>
                  <span className={styles.productTitle} title={product.title}>
                    {product.title}
                  </span>
                  <span className={styles.serialNumber}>
                    SN-{product.serialNumber}
                  </span>
                </div>
              </Tooltip>

              <span className={`${styles.statusText} ${statusClass}`}>
                {statusText}
              </span>

              <Tooltip content={t.products.deleteProduct}>
                <button
                  type="button"
                  className={styles.deleteProductBtn}
                  onClick={() => onDeleteProduct && onDeleteProduct(product)}
                  title={t.products.deleteProduct}
                >
                  <Trash2 size={15} />
                </button>
              </Tooltip>
            </div>
          );
        })}

        {products.length === 0 && (
          <div style={{ padding: '34px', color: '#90a4ae', fontSize: '14px' }}>
            {t.orders.emptyDetailProducts}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailPanel;
