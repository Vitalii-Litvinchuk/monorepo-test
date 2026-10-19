'use client';

import React from 'react';
import { X, Trash2 } from 'lucide-react';
import styles from './delete-confirm-modal.module.scss';
import { Order } from '@dzencode/contracts';

interface DeleteConfirmModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
  loading = false,
}) => {
  if (!isOpen || !order) return null;

  const firstProduct = order.products?.[0];

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
          title="Закрыть"
        >
          <X size={18} />
        </button>

        <div className={styles.modalBody}>
          <h3 className={styles.modalTitle}>
            Вы уверены, что хотите удалить этот приход?
          </h3>

          <div className={styles.previewRow}>
            <span className={styles.statusDot} />

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/static/${firstProduct?.photo || '550e8400-e29b-41d4-a716-446655440000.png'}`}
              alt="Preview"
              className={styles.previewPhoto}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />

            <div className={styles.previewInfo}>
              <span className={styles.previewTitle}>
                {firstProduct?.title || order.title}
              </span>
              <span className={styles.previewSub}>
                {firstProduct ? `SN-${firstProduct.serialNumber}` : `Продуктов: ${order.productsCount}`}
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
            ОТМЕНИТЬ
          </button>

          <button
            type="button"
            className={styles.deleteBtn}
            onClick={onConfirm}
            disabled={loading}
          >
            <Trash2 size={16} />
            {loading ? 'УДАЛЕНИЕ...' : 'УДАЛИТЬ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
