'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import styles from './product-form-modal.module.scss';
import {
  Product,
  Order,
  Group,
  User,
  ProductCondition,
  ProductOperationalStatus,
  CurrencyCode,
  PriceCurrencyRole,
  CreateProductDto,
  UpdateProductDto,
} from '@dzencode/contracts';
import { useTranslation } from '../../i18n';

interface ProductFormModalProps {
  product?: Product | null;
  orders: Order[];
  groups?: Group[];
  users?: User[];
  availableTypes?: string[];
  availableSpecifications?: string[];
  defaultOrderId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateProductDto | UpdateProductDto) => Promise<void>;
}

const DEFAULT_TYPES = ['Monitors', 'Laptops', 'Smartphones', 'Tablets'];
const DEFAULT_SPECS = ['Specification 1', 'Specification 2', 'Specification 3'];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  orders,
  groups = [],
  users = [],
  availableTypes = DEFAULT_TYPES,
  availableSpecifications = DEFAULT_SPECS,
  defaultOrderId,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t, formatProductType } = useTranslation();

  const [title, setTitle] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [type, setType] = useState('Monitors');
  const [specification, setSpecification] = useState('Specification 1');
  const [condition, setCondition] = useState<ProductCondition>(ProductCondition.NEW);
  const [operationalStatus, setOperationalStatus] = useState<ProductOperationalStatus>(
    ProductOperationalStatus.AVAILABLE,
  );
  const [orderId, setOrderId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [guaranteeStart, setGuaranteeStart] = useState('');
  const [guaranteeEnd, setGuaranteeEnd] = useState('');
  const [priceUsd, setPriceUsd] = useState('100');
  const [priceUah, setPriceUah] = useState('4100');
  const [photo, setPhoto] = useState('550e8400-e29b-41d4-a716-446655440000.png');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(product);

  useEffect(() => {
    if (!isOpen) return;

    if (product) {
      setTitle(product.title || '');
      setSerialNumber(String(product.serialNumber || ''));
      setType(product.type || availableTypes[0] || 'Monitors');
      setSpecification(product.specification || 'Specification 1');
      setCondition(product.condition || ProductCondition.NEW);
      setOperationalStatus(product.operationalStatus || ProductOperationalStatus.AVAILABLE);
      setOrderId(product.orderId || defaultOrderId || (orders[0]?.id ?? ''));
      setGroupId(product.groupId || '');
      setAssignedUserId(product.assignedUserId || '');
      setPhoto(product.photo || '550e8400-e29b-41d4-a716-446655440000.png');

      if (product.guarantee?.start) {
        setGuaranteeStart(product.guarantee.start.substring(0, 10));
      } else {
        setGuaranteeStart(new Date().toISOString().substring(0, 10));
      }

      if (product.guarantee?.end) {
        setGuaranteeEnd(product.guarantee.end.substring(0, 10));
      } else {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setGuaranteeEnd(nextYear.toISOString().substring(0, 10));
      }

      const usd = product.prices?.find((p) => p.currencyCode === CurrencyCode.USD);
      const uah = product.prices?.find((p) => p.currencyCode === CurrencyCode.UAH);
      setPriceUsd(usd ? String(usd.value) : '100');
      setPriceUah(uah ? String(uah.value) : '4100');
    } else {
      setTitle('');
      setSerialNumber(String(Math.floor(10000000 + Math.random() * 90000000)));
      setType(availableTypes[0] || 'Monitors');
      setSpecification('Specification 1');
      setCondition(ProductCondition.NEW);
      setOperationalStatus(ProductOperationalStatus.AVAILABLE);
      setOrderId(defaultOrderId || (orders[0]?.id ?? ''));
      setGroupId('');
      setAssignedUserId('');
      setPhoto('550e8400-e29b-41d4-a716-446655440000.png');

      const today = new Date().toISOString().substring(0, 10);
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setGuaranteeStart(today);
      setGuaranteeEnd(nextYear.toISOString().substring(0, 10));
      setPriceUsd('100');
      setPriceUah('4100');
    }
    setError(null);
  }, [product, defaultOrderId, orders, availableTypes, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError(t.products.colTitle);
      return;
    }

    if (!orderId) {
      setError(t.products.assignOrder);
      return;
    }

    const sNum = parseInt(serialNumber, 10);
    if (isNaN(sNum) || sNum <= 0) {
      setError(t.products.serialNumber);
      return;
    }

    const valUsd = parseFloat(priceUsd);
    const valUah = parseFloat(priceUah);
    if (isNaN(valUsd) || isNaN(valUah)) {
      setError(t.products.colPrice);
      return;
    }

    setSubmitting(true);
    setError(null);

    const prices = [
      {
        value: valUsd,
        currencyCode: CurrencyCode.USD,
        currencyRole: PriceCurrencyRole.VALUATION_REFERENCE,
      },
      {
        value: valUah,
        currencyCode: CurrencyCode.UAH,
        currencyRole: PriceCurrencyRole.PRIMARY_SETTLEMENT,
      },
    ];

    try {
      if (isEdit) {
        const updateDto: UpdateProductDto = {
          title: title.trim(),
          serialNumber: sNum,
          type: type.trim(),
          specification: specification.trim(),
          condition,
          operationalStatus,
          orderId,
          groupId: groupId ? groupId : null,
          assignedUserId: assignedUserId ? assignedUserId : null,
          guaranteeStart: new Date(guaranteeStart).toISOString(),
          guaranteeEnd: new Date(guaranteeEnd).toISOString(),
          prices,
          photo: photo.trim() || undefined,
        };
        await onSubmit(updateDto);
      } else {
        const createDto: CreateProductDto = {
          title: title.trim(),
          serialNumber: sNum,
          type: type.trim(),
          specification: specification.trim(),
          condition,
          operationalStatus,
          orderId,
          groupId: groupId ? groupId : null,
          assignedUserId: assignedUserId ? assignedUserId : null,
          guaranteeStart: new Date(guaranteeStart).toISOString(),
          guaranteeEnd: new Date(guaranteeEnd).toISOString(),
          prices,
          photo: photo.trim() || undefined,
        };
        await onSubmit(createDto);
      }
      onClose();
    } catch (err: any) {
      setError(err?.title || err?.message || 'Failed to save product');
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
          <div className={styles.scrollArea}>
            <h3 className={styles.modalTitle}>
              {isEdit ? t.products.editProductModalTitle : t.products.createProductModalTitle}
            </h3>

            {error && <div className={styles.errorBox}>{error}</div>}

            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>{t.products.colTitle} *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Gigabyte GeForce RTX 4070 Ti 12GB..."
                  required
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.serialNumber} *</label>
                <input
                  type="number"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.assignOrder} *</label>
                <select
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    -- {t.products.assignOrder} --
                  </option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.type}</label>
                <input
                  type="text"
                  list="product-form-types-list"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder={t.products.typeInputPlaceholder}
                  required
                />
                <datalist id="product-form-types-list">
                  {availableTypes.map((tVal) => (
                    <option key={tVal} value={tVal}>
                      {formatProductType(tVal)}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.specification}</label>
                <input
                  type="text"
                  list="product-form-specs-list"
                  value={specification}
                  onChange={(e) => setSpecification(e.target.value)}
                  placeholder="Specification 1"
                  required
                />
                <datalist id="product-form-specs-list">
                  {availableSpecifications.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </datalist>
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.assignGroup}</label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  <option value="">-- {t.products.notAssigned} --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.assignUser}</label>
                <select
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                >
                  <option value="">-- {t.products.notAssigned} --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.condition}</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as ProductCondition)}
                >
                  <option value={ProductCondition.NEW}>{t.products.conditionNew}</option>
                  <option value={ProductCondition.USED}>{t.products.conditionUsed}</option>
                  <option value={ProductCondition.REFURBISHED}>
                    {t.products.conditionRefurbished}
                  </option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.operationalStatus}</label>
                <select
                  value={operationalStatus}
                  onChange={(e) =>
                    setOperationalStatus(e.target.value as ProductOperationalStatus)
                  }
                >
                  <option value={ProductOperationalStatus.AVAILABLE}>
                    {t.products.statusAvailable}
                  </option>
                  <option value={ProductOperationalStatus.IN_REPAIR}>
                    {t.products.statusInRepair}
                  </option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.priceUsd}</label>
                <input
                  type="number"
                  step="0.01"
                  value={priceUsd}
                  onChange={(e) => setPriceUsd(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.priceUah}</label>
                <input
                  type="number"
                  step="0.01"
                  value={priceUah}
                  onChange={(e) => setPriceUah(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.guaranteeStart}</label>
                <input
                  type="date"
                  value={guaranteeStart}
                  onChange={(e) => setGuaranteeStart(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{t.products.guaranteeEnd}</label>
                <input
                  type="date"
                  value={guaranteeEnd}
                  onChange={(e) => setGuaranteeEnd(e.target.value)}
                  required
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>{t.products.photo}</label>
                <input
                  type="text"
                  value={photo}
                  onChange={(e) => setPhoto(e.target.value)}
                  placeholder="550e8400-e29b-41d4-a716-446655440000.png"
                />
              </div>
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

export default ProductFormModal;
