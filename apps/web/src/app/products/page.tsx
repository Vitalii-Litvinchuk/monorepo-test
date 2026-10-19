'use client';

import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchProducts,
  fetchProductTypes,
  fetchProductSpecifications,
  setSelectedType,
  setSelectedSpecification,
  deleteProduct,
} from '../../store/slices/products-slice';
import { ProductRow } from '../../components/product-row';
import { ViewModeToggle } from '../../components/view-mode-toggle';
import { ProductsSkeletonList } from '../../components/skeleton';
import { useDebounce } from '../../utils/use-debounce';
import { Product } from '@dzencode/contracts';

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const {
    items: products,
    types,
    specifications,
    selectedType,
    selectedSpecification,
    loading,
  } = useAppSelector((state) => state.products);
  const viewMode = useAppSelector((state) => state.ui.productTableViewMode);
  const globalSearch = useAppSelector((state) => state.ui.globalSearch);
  const debouncedSearch = useDebounce(globalSearch, 280);

  // Fetch filter metadata only once if not loaded
  useEffect(() => {
    if (types.length === 0) {
      dispatch(fetchProductTypes());
    }
    if (specifications.length === 0) {
      dispatch(fetchProductSpecifications());
    }
  }, [dispatch, types.length, specifications.length]);

  // Fetch products with debounced search query to prevent server overload
  useEffect(() => {
    dispatch(
      fetchProducts({
        type: selectedType,
        specification: selectedSpecification,
        search: debouncedSearch,
      }),
    );
  }, [dispatch, selectedType, selectedSpecification, debouncedSearch]);

  const handleDeleteProduct = useCallback(
    async (product: Product) => {
      if (confirm(`Вы уверены, что хотите удалить продукт "${product.title}"?`)) {
        await dispatch(deleteProduct(product.id));
      }
    },
    [dispatch],
  );

  return (
    <div>
      {/* Top filters bar matching products-list.png */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 28,
          marginBottom: 32,
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          Продукты / {products.length}
        </h1>

        {/* Filter 1: Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Тип:
          </label>
          <select
            value={selectedType}
            onChange={(e) => dispatch(setSelectedType(e.target.value))}
            style={{
              width: 334,
              height: 30,
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-border-card)',
              borderRadius: 3,
              padding: '0 10px',
              fontSize: 13,
              color: 'var(--color-text-primary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Все типы</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 2: Specification */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Спецификация:
          </label>
          <select
            value={selectedSpecification}
            onChange={(e) => dispatch(setSelectedSpecification(e.target.value))}
            style={{
              width: 334,
              height: 30,
              backgroundColor: '#ffffff',
              border: '1px solid var(--color-border-card)',
              borderRadius: 3,
              padding: '0 10px',
              fontSize: 13,
              color: 'var(--color-text-primary)',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">Все спецификации</option>
            {specifications.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Best Practice View Mode Switcher */}
        <div style={{ marginLeft: 'auto' }}>
          <ViewModeToggle />
        </div>
      </div>

      {/* Container for products list */}
      <div
        className={viewMode === 'classic-scroll' ? 'custom-scrollbar' : undefined}
        style={{
          overflowX: viewMode === 'classic-scroll' ? 'auto' : 'visible',
          paddingBottom: 20,
        }}
      >
        {/* Table column headers for Optimized Grid View */}
        {viewMode === 'optimized-grid' && (
          <div
            style={{
              width: 1434,
              maxWidth: '100%',
              padding: '0 24px 10px',
              display: 'grid',
              gridTemplateColumns: '28px 46px 2.2fr 1.2fr 1fr 1.2fr 1.5fr 36px',
              gap: 16,
              fontSize: 11,
              fontWeight: 700,
              color: '#90a4ae',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
            }}
          >
            <span />
            <span />
            <span>Наименование / Серийный №</span>
            <span>Статус / Состояние</span>
            <span>Гарантия</span>
            <span>Стоимость</span>
            <span>Привязка (Приход / Ответственный)</span>
            <span />
          </div>
        )}

        {/* Products rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading && products.length === 0 ? (
            <ProductsSkeletonList count={7} viewMode={viewMode} />
          ) : (
            products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                viewMode={viewMode}
                onDeleteClick={handleDeleteProduct}
              />
            ))
          )}

          {!loading && products.length === 0 && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cfd8dc',
                borderRadius: 4,
                padding: 32,
                textAlign: 'center',
                color: '#90a4ae',
                width: viewMode === 'optimized-grid' ? 1434 : 2542,
                maxWidth: '100%',
              }}
            >
              Продуктов по выбранным фильтрам не найдено.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
