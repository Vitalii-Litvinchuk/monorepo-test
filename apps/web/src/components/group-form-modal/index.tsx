'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import styles from './group-form-modal.module.scss';
import { Group } from '@dzencode/contracts';
import { useTranslation } from '../../i18n';

interface GroupFormModalProps {
  group?: Group | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string }) => Promise<void>;
}

export const GroupFormModal: React.FC<GroupFormModalProps> = ({
  group,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(group);

  useEffect(() => {
    if (group) {
      setTitle(group.title || '');
      setDescription(group.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
    setError(null);
  }, [group, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t.groups.groupTitleLabel);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.title || err?.message || 'Failed to save group');
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
              {isEdit ? t.groups.editGroupModalTitle : t.groups.createGroupModalTitle}
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
              <label>{t.groups.groupTitleLabel}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.groups.groupTitlePlaceholder}
                autoFocus
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>{t.groups.groupDescLabel}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.groups.groupDescPlaceholder}
                rows={3}
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
              {t.groups.cancel}
            </button>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              <Check size={16} />
              {submitting ? t.groups.saving : t.groups.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupFormModal;
