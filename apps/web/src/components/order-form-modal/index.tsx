'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import styles from './order-form-modal.module.scss';
import { Order } from '@dzencode/contracts';
import { useTranslation } from '../../i18n';

interface OrderFormModalProps {
  order?: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; location?: string }) => Promise<void>;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  order,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(order);

  useEffect(() => {
    if (order) {
      setTitle(order.title || '');
      setDescription(order.description || '');
      setLocation(order.location || '');
    } else {
      setTitle('');
      setDescription('');
      setLocation('Центральний склад #1 (Київ)');
    }
    setError(null);
  }, [order, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t.orders.orderTitleLabel);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.title || err?.message || 'Failed to save order');
    } finally {
      setSubmitting(false);
    }
  };

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

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <h3 className={styles.modalTitle}>
              {isEdit ? t.orders.editOrderModalTitle : t.orders.createOrderModalTitle}
            </h3>

            {error && (
              <div
                style={{
                  background: '#ffebee',
                  color: '#c62828',
                  padding: '10px 14px',
                  borderRadius: 4,
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <div className={styles.formGroup}>
              <label>
                {t.orders.orderTitleLabel} *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Приход #1 Samsung & Apple"
                required
                autoFocus
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t.orders.orderDescLabel}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Додаткові примітки або опис партії товарів..."
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t.orders.orderLocationLabel}</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Центральний склад #1 (Київ)"
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
              disabled={submitting}
            >
              {t.orders.cancel}
            </button>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              <Check size={16} />
              {submitting ? t.orders.saving : t.orders.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderFormModal;
