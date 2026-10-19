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

interface ProductRowProps {
  product: Product;
  viewMode?: ProductTableViewMode;
  onDeleteClick?: (product: Product) => void;
}

export const ProductRow: React.FC<ProductRowProps> = ({
  product,
  viewMode = 'optimized-grid',
  onDeleteClick,
}) => {
  const isRepair = product.operationalStatus === ProductOperationalStatus.IN_REPAIR;
  const statusText = isRepair ? 'В ремонте' : 'свободен';
  const statusClass = isRepair ? styles.repair : styles.available;

  const conditionText =
    product.condition === ProductCondition.NEW
      ? 'новый'
      : product.condition === ProductCondition.USED
        ? 'Б / У'
        : 'восстановл.';

  const gStartDate = product.guarantee?.start ? new Date(product.guarantee.start) : null;
  const gEndDate = product.guarantee?.end ? new Date(product.guarantee.end) : null;

  const formatDate = (date: Date | null) => {
    if (!date) return '—';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d} / ${m} / ${y}`;
  };

  const cDate = product.createdAt ? new Date(product.createdAt) : new Date();
  const monthsRu = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const cd = String(cDate.getDate()).padStart(2, '0');
  const cm = monthsRu[cDate.getMonth()];
  const cy = cDate.getFullYear();
  const cMonthNum = String(cDate.getMonth() + 1).padStart(2, '0');

  const usdPrice = product.prices?.find((p) => p.currencyCode === CurrencyCode.USD)?.value || 0;
  const uahPrice = product.prices?.find((p) => p.currencyCode === CurrencyCode.UAH)?.value || 0;

  const formatNumber = (num: number) => {
    return num.toLocaleString('ru-RU', {
      minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  if (viewMode === 'classic-scroll') {
    // Exact 1-to-1 match to products-list.png layout (2542px width)
    return (
      <div className={`${styles.rowContainer} ${styles.classicScroll}`}>
        <span className={`${styles.statusDot} ${statusClass}`} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/static/${product.photo}`}
          alt={product.title}
          className={styles.photo}
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
            <span>с</span>
            <span className="tabular-nums">{formatDate(gStartDate)}</span>
          </div>
          <div className={styles.guaranteeRow}>
            <span>по</span>
            <span className="tabular-nums">{formatDate(gEndDate)}</span>
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
            {cd} / {cMonthNum}
          </span>
          <span className={`${styles.fullDate} tabular-nums`}>
            {cd} / {cm} / {cy}
          </span>
        </div>

        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => onDeleteClick && onDeleteClick(product)}
          title="Удалить продукт"
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
        src={`/static/${product.photo}`}
        alt={product.title}
        className={styles.photo}
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
          <span>с</span>
          <span className="tabular-nums">{formatDate(gStartDate)}</span>
        </div>
        <div className={styles.guaranteeRow}>
          <span>по</span>
          <span className="tabular-nums">{formatDate(gEndDate)}</span>
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
          title={`Приход: ${product.orderTitle || '—'}`}
        >
          📦 {product.orderTitle || '—'}
        </span>
        <span
          className={styles.userCol}
          title={`Ответственный: ${product.assignedUserName || 'Не назначен'}`}
        >
          👤 {product.assignedUserName || 'Не назначен'}
        </span>
      </div>

      <button
        type="button"
        className={styles.deleteBtn}
        onClick={() => onDeleteClick && onDeleteClick(product)}
        title="Удалить продукт"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default ProductRow;
