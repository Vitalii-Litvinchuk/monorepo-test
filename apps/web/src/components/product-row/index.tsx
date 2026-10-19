'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
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

interface ProductRowProps {
  product: Product;
  viewMode?: ProductTableViewMode;
  onDeleteClick?: (product: Product) => void;
}

export const ProductRow: React.FC<ProductRowProps> = React.memo(({
  product,
  viewMode = 'optimized-grid',
  onDeleteClick,
}) => {
  const {
    t,
    formatDateGeneral,
    formatDateShort,
    formatDateFull,
    formatNumber,
  } = useTranslation();

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

  if (viewMode === 'classic-scroll') {
    // Exact 1-to-1 match to products-list.png layout (2542px width)
    return (
      <div className={`${styles.rowContainer} ${styles.classicScroll}`}>
        <span className={`${styles.statusDot} ${statusClass}`} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getStaticUrl(product.photo)}
          alt={product.title}
          className={styles.photo}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        <div className={`${styles.titleBox} ${styles.classicWidth}`}>
          <span className={styles.productTitle} title={product.title}>
            {product.title}
          </span>
          <span className={styles.serialNumber}>SN-{product.serialNumber}</span>
        </div>

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

        <span className={`${styles.groupCol} ${styles.classicWidth}`} title={product.groupTitle || '—'}>
          {product.groupTitle || '—'}
        </span>

        <span className={`${styles.userCol} ${styles.classicWidth}`} title={product.assignedUserName || '—'}>
          {product.assignedUserName || '—'}
        </span>

        <span className={`${styles.orderCol} ${styles.classicWidth}`} title={product.orderTitle || '—'}>
          {product.orderTitle || '—'}
        </span>

        <div className={`${styles.dateCol} ${styles.classicWidth}`}>
          <span className={`${styles.shortDate} tabular-nums`}>
            {shortCreatedDate}
          </span>
          <span className={`${styles.fullDate} tabular-nums`}>
            {fullCreatedDate}
          </span>
        </div>

        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => onDeleteClick && onDeleteClick(product)}
          title={t.products.deleteProduct}
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  // Optimized Grid View: fits perfectly within 1434px without horizontal scrolling
  return (
    <div className={`${styles.rowContainer} ${styles.optimizedGrid}`}>
      <span className={`${styles.statusDot} ${statusClass}`} />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getStaticUrl(product.photo)}
        alt={product.title}
        className={styles.photo}
        loading="lazy"
        decoding="async"
        onError={(e) => {
          (e.target as HTMLElement).style.display = 'none';
        }}
      />

      <div className={styles.titleBox}>
        <span className={styles.productTitle} title={product.title}>
          {product.title}
        </span>
        <span className={styles.serialNumber}>
          SN-{product.serialNumber} • {product.type}
        </span>
      </div>

      <div className={styles.badgeGroup}>
        <span className={`${styles.statusCol} ${statusClass}`}>
          {statusText}
        </span>
        <span className={styles.conditionCol}>{conditionText}</span>
      </div>

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

      <div className={styles.priceCol}>
        <span className={`${styles.priceUsd} tabular-nums`}>
          {formatNumber(usdPrice)} $
        </span>
        <span className={`${styles.priceUah} tabular-nums`}>
          {formatNumber(uahPrice)} <span>UAH</span>
        </span>
      </div>

      <div className={styles.badgeGroup}>
        <span
          className={styles.orderCol}
          title={`${t.products.bindingOrder} ${product.orderTitle || '—'}`}
        >
          📦 {product.orderTitle || '—'}
        </span>
        <span
          className={styles.userCol}
          title={`${t.products.bindingUser} ${product.assignedUserName || t.products.notAssigned}`}
        >
          👤 {product.assignedUserName || t.products.notAssigned}
        </span>
      </div>

      <button
        type="button"
        className={styles.deleteBtn}
        onClick={() => onDeleteClick && onDeleteClick(product)}
        title={t.products.deleteProduct}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
});

export default ProductRow;
