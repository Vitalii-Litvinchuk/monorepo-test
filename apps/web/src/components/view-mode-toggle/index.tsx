'use client';

import React from 'react';
import { LayoutGrid, StretchHorizontal } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setProductTableViewMode } from '../../store/slices/ui-slice';
import { useTranslation } from '../../i18n';

export const ViewModeToggle: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentMode = useAppSelector((state) => state.ui.productTableViewMode);
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#ffffff',
        border: '1px solid #cfd8dc',
        borderRadius: '4px',
        padding: '2px',
        gap: '4px',
      }}
    >
      <button
        type="button"
        onClick={() => dispatch(setProductTableViewMode('optimized-grid'))}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: '3px',
          background: currentMode === 'optimized-grid' ? '#8bc34a' : 'transparent',
          color: currentMode === 'optimized-grid' ? '#ffffff' : '#546e7a',
          transition: 'all 0.15s',
        }}
        title={t.products.viewOptimized}
      >
        <LayoutGrid size={14} />
        {t.products.viewOptimized}
      </button>

      <button
        type="button"
        onClick={() => dispatch(setProductTableViewMode('classic-scroll'))}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          fontSize: '12px',
          fontWeight: 600,
          borderRadius: '3px',
          background: currentMode === 'classic-scroll' ? '#8bc34a' : 'transparent',
          color: currentMode === 'classic-scroll' ? '#ffffff' : '#546e7a',
          transition: 'all 0.15s',
        }}
        title={t.products.viewClassic}
      >
        <StretchHorizontal size={14} />
        {t.products.viewClassic}
      </button>
    </div>
  );
};

export default ViewModeToggle;
