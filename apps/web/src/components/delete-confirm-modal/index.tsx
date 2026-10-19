'use client';

import React from 'react';
import { X, Trash2 } from 'lucide-react';
import styles from './delete-confirm-modal.module.scss';
import { Order, Product } from '@dzencode/contracts';
import { getStaticUrl } from '../../utils/url';
import { useTranslation } from '../../i18n';

interface DeleteConfirmModalProps {
  order?: Order | null;
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  order,
  product,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  const { t } = useTranslation();
  if (!isOpen || (!order && !product)) return null;

  const title = order
    ? t.orders.deleteOrderConfirmTitle
    : `${t.products.deleteConfirm} "${product?.title}"?`;

  const photo = order
    ? order.products?.[0]?.photo || '550e8400-e29b-41d4-a716-446655440000.png'
    : product?.photo || 'default-product.png';

  const previewTitle = order
    ? order.products?.[0]?.title || order.title
    : product?.title || '';

  const previewSub = order
    ? order.products?.[0]
      ? `SN-${order.products[0].serialNumber} • ${order.title}`
      : `${t.orders.productsCountPrefix}${order.productsCount}`
    : `SN-${product?.serialNumber} • ${product?.type}`;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          title={t.orders.close}
        >
          <X size={18} />
        </button>

        <div className={styles.modalBody}>
          <h3 className={styles.modalTitle}>
            {title}
          </h3>

          <div className={styles.previewRow}>
            <span className={styles.statusDot} />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getStaticUrl(photo)}
              alt="Preview"
              className={styles.previewPhoto}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />

            <div className={styles.previewInfo}>
              <span className={styles.previewTitle}>
                {previewTitle}
              </span>
              <span className={styles.previewSub}>
                {previewSub}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={loading}
          >
            {t.orders.cancel}
          </button>

          <button
            type="button"
            className={styles.deleteBtn}
            onClick={onConfirm}
            disabled={loading}
          >
            <Trash2 size={16} />
            {loading ? t.orders.deleting : t.orders.delete}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
