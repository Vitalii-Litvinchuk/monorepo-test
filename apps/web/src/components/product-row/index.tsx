'use client';

import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import styles from './product-row.module.scss';
import {
  Product,
  ProductCondition,
  ProductOperationalStatus,
  CurrencyCode,
} from '@dzencode/contracts';
import { ProductTableViewMode } from '../../store/slices/ui-slice';
import { getStaticUrl } from '../../utils/url';
import { useTranslation } from '../../i18n';
import { Tooltip } from '../tooltip';

interface ProductRowProps {
  product: Product;
  viewMode?: ProductTableViewMode;
  onEditClick?: (product: Product) => void;
  onDeleteClick?: (product: Product) => void;
}

export const ProductRow: React.FC<ProductRowProps> = React.memo(({
  product,
  viewMode = 'optimized-grid',
  onEditClick,
  onDeleteClick,
}) => {
  const {
    t,
    formatDateGeneral,
    formatDateShort,
    formatDateFull,
    formatNumber,
    formatProductType,
  } = useTranslation();

  const formattedType = formatProductType(product.type);

  const isRepair = product.operationalStatus === ProductOperationalStatus.IN_REPAIR;
  const statusText = isRepair ? t.products.statusInRepair : t.products.statusAvailable;
  const statusClass = isRepair ? styles.repair : styles.available;

  const conditionText =
    product.condition === ProductCondition.NEW
      ? t.products.conditionNew
      : product.condition === ProductCondition.USED
        ? t.products.conditionUsed
        : t.products.conditionRefurbished;

  const gStartDate = product.guarantee?.start ? new Date(product.guarantee.start) : null;
  const gEndDate = product.guarantee?.end ? new Date(product.guarantee.end) : null;

  const cDate = product.createdAt ? new Date(product.createdAt) : new Date();
  const shortCreatedDate = formatDateShort(cDate);
  const fullCreatedDate = formatDateFull(cDate);

  const usdPrice = product.prices?.find((p) => p.currencyCode === CurrencyCode.USD)?.value || 0;
  const uahPrice = product.prices?.find((p) => p.currencyCode === CurrencyCode.UAH)?.value || 0;

  const fullTitleTooltip = (
    <div>
      <div style={{ fontWeight: 600 }}>{product.title}</div>
      <div style={{ opacity: 0.85, fontSize: 11, marginTop: 2 }}>
        SN-{product.serialNumber} • {formattedType} • {product.specification}
      </div>
    </div>
  );

  const photoUrl = getStaticUrl(product.photo) || '/static/default-product.svg';

  if (viewMode === 'classic-scroll') {
    // Exact match to products-list.png layout (2542px width)
    return (
      <div className={`${styles.rowContainer} ${styles.classicScroll}`}>
        <Tooltip content={statusText}>
          <span className={`${styles.statusDot} ${statusClass}`} />
        </Tooltip>

        <div className={styles.photoCol}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={product.title}
            className={styles.photo}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/static/default-product.svg';
            }}
          />
        </div>

        <Tooltip content={fullTitleTooltip}>
          <div className={`${styles.titleBox} ${styles.classicWidth}`}>
            <span className={styles.productTitle} title={product.title}>
              {product.title}
            </span>
            <span className={styles.serialNumber}>SN-{product.serialNumber}</span>
          </div>
        </Tooltip>

        <span className={`${styles.statusCol} ${statusClass} ${styles.classicWidth}`}>
          {statusText}
        </span>

        <div className={`${styles.guaranteeCol} ${styles.classicWidth}`}>
          <div className={styles.guaranteeRow}>
            <span>{t.products.guaranteeFrom}</span>
            <span className="tabular-nums">{formatDateGeneral(gStartDate)}</span>
          </div>
          <div className={styles.guaranteeRow}>
            <span>{t.products.guaranteeTo}</span>
            <span className="tabular-nums">{formatDateGeneral(gEndDate)}</span>
          </div>
        </div>

        <span className={`${styles.conditionCol} ${styles.classicWidth}`}>
          {conditionText}
        </span>

        <div className={`${styles.priceCol} ${styles.classicWidth}`}>
          <span className={`${styles.priceUsd} tabular-nums`}>
            {formatNumber(usdPrice)} $
          </span>
          <span className={`${styles.priceUah} tabular-nums`}>
            {formatNumber(uahPrice)} <span>UAH</span>
          </span>
        </div>

        <Tooltip content={product.groupTitle || '—'}>
          <span className={`${styles.groupCol} ${styles.classicWidth}`}>
            {product.groupTitle || '—'}
          </span>
        </Tooltip>

        <Tooltip content={product.assignedUserName || '—'}>
          <span className={`${styles.userCol} ${styles.classicWidth}`}>
            {product.assignedUserName || '—'}
          </span>
        </Tooltip>

        <Tooltip content={product.orderTitle || '—'}>
          <span className={`${styles.orderCol} ${styles.classicWidth}`}>
            {product.orderTitle || '—'}
          </span>
        </Tooltip>

        <div className={`${styles.dateCol} ${styles.classicWidth}`}>
          <span className={`${styles.shortDate} tabular-nums`}>
            {shortCreatedDate}
          </span>
          <span className={`${styles.fullDate} tabular-nums`}>
            {fullCreatedDate}
          </span>
        </div>

        <div className={styles.actionsCol}>
          <Tooltip content={t.products.editProduct}>
            <button
              type="button"
              className={styles.editBtn}
              onClick={() => onEditClick && onEditClick(product)}
              title={t.products.editProduct}
            >
              <Pencil size={15} />
            </button>
          </Tooltip>
          <Tooltip content={t.products.deleteProduct}>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => onDeleteClick && onDeleteClick(product)}
              title={t.products.deleteProduct}
            >
              <Trash2 size={16} />
            </button>
          </Tooltip>
        </div>
      </div>
    );
  }

  // Optimized Grid View: fits perfectly within 1434px with 8 locked grid cells
  return (
    <div className={`${styles.rowContainer} ${styles.optimizedGrid}`}>
      {/* 1. Status Dot */}
      <Tooltip content={statusText}>
        <span className={`${styles.statusDot} ${statusClass}`} />
      </Tooltip>

      {/* 2. Photo Column (Always in Track 2, never collapses) */}
      <div className={styles.photoCol}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={product.title}
          className={styles.photo}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/static/default-product.svg';
          }}
        />
      </div>

      {/* 3. Title & Serial Column */}
      <Tooltip content={fullTitleTooltip}>
        <div className={styles.titleBox}>
          <span className={styles.productTitle}>
            {product.title}
          </span>
          <span className={styles.serialNumber}>
            SN-{product.serialNumber} • {formattedType}
          </span>
        </div>
      </Tooltip>

      {/* 4. Status & Condition Column */}
      <div className={styles.badgeGroup}>
        <span className={`${styles.statusCol} ${statusClass}`}>
          {statusText}
        </span>
        <span className={styles.conditionCol}>{conditionText}</span>
      </div>

      {/* 5. Guarantee Column */}
      <div className={styles.guaranteeCol}>
        <div className={styles.guaranteeRow}>
          <span>{t.products.guaranteeFrom}</span>
          <span className="tabular-nums">{formatDateGeneral(gStartDate)}</span>
        </div>
        <div className={styles.guaranteeRow}>
          <span>{t.products.guaranteeTo}</span>
          <span className="tabular-nums">{formatDateGeneral(gEndDate)}</span>
        </div>
      </div>

      {/* 6. Price Column */}
      <div className={styles.priceCol}>
        <span className={`${styles.priceUsd} tabular-nums`}>
          {formatNumber(usdPrice)} $
        </span>
        <span className={`${styles.priceUah} tabular-nums`}>
          {formatNumber(uahPrice)} <span>UAH</span>
        </span>
      </div>

      {/* 7. Binding (Order & User) Column */}
      <div className={styles.badgeGroup}>
        <Tooltip content={`${t.products.bindingOrder} ${product.orderTitle || '—'}`}>
          <span className={styles.orderCol}>
            📦 {product.orderTitle || '—'}
          </span>
        </Tooltip>
        <Tooltip content={`${t.products.bindingUser} ${product.assignedUserName || t.products.notAssigned}`}>
          <span className={styles.userCol}>
            👤 {product.assignedUserName || t.products.notAssigned}
          </span>
        </Tooltip>
      </div>

      {/* 8. Actions Column */}
      <div className={styles.actionsCol}>
        <Tooltip content={t.products.editProduct}>
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => onEditClick && onEditClick(product)}
            title={t.products.editProduct}
          >
            <Pencil size={15} />
          </button>
        </Tooltip>
        <Tooltip content={t.products.deleteProduct}>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={() => onDeleteClick && onDeleteClick(product)}
            title={t.products.deleteProduct}
          >
            <Trash2 size={16} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
});

export default ProductRow;
