'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import styles from './type-create-modal.module.scss';
import { useTranslation } from '../../i18n';

interface TypeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (type: string) => Promise<void>;
}

export const TypeCreateModal: React.FC<TypeCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [typeName, setTypeName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = typeName.trim();
    if (!clean) {
      setError(t.products.typeEmptyError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(clean);
      setTypeName('');
      onClose();
    } catch (err: any) {
      setError(err?.message || t.products.typeCreateError);
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
            <h3 className={styles.modalTitle}>{t.products.createTypeModalTitle}</h3>

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
              <label>{t.products.typeNameLabel} *</label>
              <input
                type="text"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder={t.products.typeNamePlaceholder}
                required
                autoFocus
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

export default TypeCreateModal;
