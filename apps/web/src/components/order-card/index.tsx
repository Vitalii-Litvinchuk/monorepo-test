'use client';

import React from 'react';
import { List, Pencil, Trash2, ChevronRight } from 'lucide-react';
import styles from './order-card.module.scss';
import { Order, CurrencyCode } from '@dzencode/contracts';
import { useTranslation } from '../../i18n';

interface OrderCardProps {
  order: Order;
  isCompact?: boolean;
  isActive?: boolean;
  onSelect?: (orderId: string) => void;
  onEditClick?: (order: Order) => void;
  onDeleteClick?: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = React.memo(({
  order,
  isCompact = false,
  isActive = false,
  onSelect,
  onEditClick,
  onDeleteClick,
}) => {
  const { t, formatDateShort, formatDateFull, formatNumber } = useTranslation();
  const dateObj = new Date(order.createdAt);

  const shortDate = formatDateShort(dateObj);
  const fullDate = formatDateFull(dateObj);

  const usdPrice = order.totalPrices?.find((p) => p.currencyCode === CurrencyCode.USD)?.value || 0;
  const uahPrice = order.totalPrices?.find((p) => p.currencyCode === CurrencyCode.UAH)?.value || 0;

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(order.id);
    }
  };

  return (
    <div
      className={`${styles.card} ${isCompact ? styles.compactMode : styles.fullMode} ${
        isActive ? styles.active : ''
      }`}
      onClick={isCompact ? handleCardClick : undefined}
    >
      {/* 1. Expand / Details Button */}
      <button
        type="button"
        className={styles.listIconBtn}
        onClick={handleCardClick}
        title={t.orders.viewProducts}
      >
        <List size={18} />
      </button>

      {/* 2. Title Column (Full Mode only) */}
      {!isCompact && (
        <div className={styles.titleCol}>
          <span
            className={styles.orderTitle}
            onClick={handleCardClick}
            title={order.title}
          >
            {order.title}
          </span>
        </div>
      )}

      {/* 3. Products Count Column */}
      <div className={styles.productsCountCol}>
        <span className={`${styles.productsCountNumber} tabular-nums`}>
          {order.productsCount}
        </span>
        <span className={styles.productsCountLabel}>{t.orders.products}</span>
      </div>

      {/* 4. Date Column */}
      <div className={styles.dateCol}>
        <span className={`${styles.dateShort} tabular-nums`}>{shortDate}</span>
        <span className={`${styles.dateFull} tabular-nums`}>{fullDate}</span>
      </div>

      {/* 5. Prices & Actions (Full Mode only) */}
      {!isCompact && (
        <>
          <div className={styles.priceCol}>
            <span className={`${styles.priceUsd} tabular-nums`}>
              {formatNumber(usdPrice)} $
            </span>
            <span className={`${styles.priceUah} tabular-nums`}>
              {formatNumber(uahPrice)} <span>UAH</span>
            </span>
          </div>

          <div className={styles.actionsCol}>
            <button
              type="button"
              className={styles.editBtn}
              onClick={(e) => {
                e.stopPropagation();
                if (onEditClick) onEditClick(order);
              }}
              title={t.orders.editOrder}
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={(e) => {
                e.stopPropagation();
                if (onDeleteClick) onDeleteClick(order);
              }}
              title={t.orders.deleteOrder}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </>
      )}

      {/* Compact Mode Active Indicator */}
      {isCompact && isActive && (
        <div className={styles.activeChevronBox}>
          <ChevronRight size={22} />
        </div>
      )}
    </div>
  );
});

export default OrderCard;
