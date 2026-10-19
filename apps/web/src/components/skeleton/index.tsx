'use client';

import React from 'react';
import styles from './skeleton.module.scss';
import { ProductTableViewMode } from '../../store/slices/ui-slice';

export interface SkeletonBoxProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`${styles.shimmerBox} ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
};

// 1. Order Card Skeleton
export interface OrderCardSkeletonProps {
  isCompact?: boolean;
}

export const OrderCardSkeleton: React.FC<OrderCardSkeletonProps> = ({
  isCompact = false,
}) => {
  if (isCompact) {
    return (
      <div className={`${styles.orderCardSkeleton} ${styles.compactMode}`}>
        <SkeletonBox width={40} height={40} className={styles.circle} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SkeletonBox width="65%" height={15} />
          <SkeletonBox width="40%" height={12} />
        </div>
        <SkeletonBox width={24} height={24} className={styles.circle} />
      </div>
    );
  }

  return (
    <div className={`${styles.orderCardSkeleton} ${styles.fullMode}`}>
      <div style={{ width: '38%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonBox width="80%" height={16} />
        <SkeletonBox width="45%" height={12} />
      </div>

      <SkeletonBox width={40} height={40} className={styles.circle} />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 90 }}>
        <SkeletonBox width={36} height={18} />
        <SkeletonBox width={54} height={12} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 120 }}>
        <SkeletonBox width={60} height={12} />
        <SkeletonBox width={85} height={14} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
        <SkeletonBox width={70} height={12} />
        <SkeletonBox width={100} height={15} />
      </div>

      <SkeletonBox width={32} height={32} borderRadius={4} />
    </div>
  );
};

export const OrdersSkeletonList: React.FC<{ count?: number; isCompact?: boolean }> = ({
  count = 6,
  isCompact = false,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} isCompact={isCompact} />
      ))}
    </div>
  );
};

// 2. Product Row Skeleton
export interface ProductRowSkeletonProps {
  viewMode?: ProductTableViewMode;
}

export const ProductRowSkeleton: React.FC<ProductRowSkeletonProps> = ({
  viewMode = 'optimized-grid',
}) => {
  if (viewMode === 'classic-scroll') {
    return (
      <div className={`${styles.productRowSkeleton} ${styles.classicScroll}`}>
        <SkeletonBox width={10} height={10} className={styles.circle} />
        <SkeletonBox width={46} height={38} borderRadius={3} />
        <div style={{ width: 380, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SkeletonBox width="75%" height={15} />
          <SkeletonBox width="40%" height={11} />
        </div>
        <SkeletonBox width={90} height={18} borderRadius={3} />
        <div style={{ width: 140, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SkeletonBox width="80%" height={12} />
          <SkeletonBox width="80%" height={12} />
        </div>
        <SkeletonBox width={80} height={16} />
        <div style={{ width: 150, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SkeletonBox width={75} height={12} />
          <SkeletonBox width={105} height={15} />
        </div>
        <SkeletonBox width={260} height={15} />
        <SkeletonBox width={180} height={15} />
        <SkeletonBox width={260} height={15} />
        <SkeletonBox width={32} height={32} borderRadius={4} />
      </div>
    );
  }

  return (
    <div className={`${styles.productRowSkeleton} ${styles.optimizedGrid}`}>
      <SkeletonBox width={10} height={10} className={styles.circle} />
      <SkeletonBox width={46} height={38} borderRadius={3} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonBox width="85%" height={15} />
        <SkeletonBox width="50%" height={11} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonBox width={70} height={14} />
        <SkeletonBox width={50} height={12} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <SkeletonBox width={80} height={12} />
        <SkeletonBox width={80} height={12} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonBox width={65} height={12} />
        <SkeletonBox width={90} height={14} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <SkeletonBox width="70%" height={13} />
        <SkeletonBox width="55%" height={13} />
      </div>
      <SkeletonBox width={32} height={32} borderRadius={4} />
    </div>
  );
};

export const ProductsSkeletonList: React.FC<{ count?: number; viewMode?: ProductTableViewMode }> = ({
  count = 7,
  viewMode = 'optimized-grid',
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductRowSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  );
};

// 3. Detail Panel Skeleton
export const OrderDetailSkeleton: React.FC = () => {
  return (
    <div className={styles.detailPanelSkeleton}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <SkeletonBox width="50%" height={22} />
        <SkeletonBox width={160} height={32} borderRadius={4} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '12px 0',
              borderBottom: '1px solid #edf1f3',
            }}
          >
            <SkeletonBox width={8} height={8} className={styles.circle} />
            <SkeletonBox width={40} height={32} borderRadius={3} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <SkeletonBox width="60%" height={14} />
              <SkeletonBox width="35%" height={11} />
            </div>
            <SkeletonBox width={70} height={14} />
            <SkeletonBox width={28} height={28} borderRadius={4} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default {
  SkeletonBox,
  OrderCardSkeleton,
  OrdersSkeletonList,
  ProductRowSkeleton,
  ProductsSkeletonList,
  OrderDetailSkeleton,
};
