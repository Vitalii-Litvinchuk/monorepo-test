'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Tag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchProducts,
  fetchProductTypes,
  fetchProductSpecifications,
  createProductType,
  setSelectedType,
  setSelectedSpecification,
  setProductToEdit,
  setProductToDelete,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../store/slices/products-slice';
import { fetchOrders } from '../../store/slices/orders-slice';
import { ProductRow } from '../../components/product-row';
import { ViewModeToggle } from '../../components/view-mode-toggle';
import { DeleteConfirmModal } from '../../components/delete-confirm-modal';
import { ProductFormModal } from '../../components/product-form-modal';
import { TypeCreateModal } from '../../components/type-create-modal';
import { CustomSelect } from '../../components/custom-select';
import { Tooltip } from '../../components/tooltip';
import { ProductsSkeletonList } from '../../components/skeleton';
import { useDebounce } from '../../utils/use-debounce';
import { Product, CreateProductDto, UpdateProductDto } from '@dzencode/contracts';
import { useTranslation } from '../../i18n';

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const {
    items: products,
    types,
    specifications,
    selectedType,
    selectedSpecification,
    productToEdit,
    productToDelete,
    loading,
  } = useAppSelector((state) => state.products);
  const { items: orders } = useAppSelector((state) => state.orders);
  const viewMode = useAppSelector((state) => state.ui.productTableViewMode);
  const { t, formatProductType } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch filter metadata and orders if not loaded
  useEffect(() => {
    if (types.length === 0) {
      dispatch(fetchProductTypes());
    }
    if (specifications.length === 0) {
      dispatch(fetchProductSpecifications());
    }
    if (orders.length === 0) {
      dispatch(fetchOrders());
    }
  }, [dispatch, types.length, specifications.length, orders.length]);

  // Fetch products with debounced search query
  useEffect(() => {
    dispatch(
      fetchProducts({
        type: selectedType,
        specification: selectedSpecification,
        search: debouncedSearch,
      }),
    );
  }, [dispatch, selectedType, selectedSpecification, debouncedSearch]);

  // Create & Edit Handlers
  const handleOpenCreate = () => {
    dispatch(setProductToEdit(null));
    setIsFormOpen(true);
  };

  const handleOpenEdit = useCallback(
    (product: Product) => {
      dispatch(setProductToEdit(product));
      setIsFormOpen(true);
    },
    [dispatch],
  );

  const handleSaveProduct = async (dto: CreateProductDto | UpdateProductDto) => {
    if (productToEdit) {
      await dispatch(
        updateProduct({ id: productToEdit.id, dto: dto as UpdateProductDto }),
      ).unwrap();
    } else {
      await dispatch(createProduct(dto as CreateProductDto)).unwrap();
    }
    // Refresh products, types and specifications
    dispatch(fetchProductTypes());
    dispatch(fetchProductSpecifications());
    dispatch(
      fetchProducts({
        type: selectedType,
        specification: selectedSpecification,
        search: debouncedSearch,
      }),
    );
  };

  // Create Type Handler
  const handleCreateType = async (typeName: string) => {
    await dispatch(createProductType(typeName)).unwrap();
    dispatch(
      fetchProducts({
        type: typeName,
        specification: selectedSpecification,
        search: debouncedSearch,
      }),
    );
  };

  // Delete Handlers
  const handleOpenDelete = useCallback(
    (product: Product) => {
      dispatch(setProductToDelete(product));
    },
    [dispatch],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteProduct(productToDelete.id)).unwrap();
      dispatch(setProductToDelete(null));
      dispatch(fetchProductTypes());
      dispatch(fetchProductSpecifications());
      dispatch(
        fetchProducts({
          type: selectedType,
          specification: selectedSpecification,
          search: debouncedSearch,
        }),
      );
    } catch (err) {
      console.error('Failed to delete product:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [dispatch, productToDelete, selectedType, selectedSpecification, debouncedSearch]);

  const typeOptions = [
    { value: 'all', label: t.products.allTypes },
    ...types.map((tVal) => ({ value: tVal, label: formatProductType(tVal) })),
  ];

  const specOptions = [
    { value: 'all', label: t.products.allSpecifications },
    ...specifications.map((s) => ({ value: s, label: s })),
  ];

  return (
    <div>
      {/* Top filters and actions bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <Tooltip content={t.products.createProduct}>
          <button
            type="button"
            onClick={handleOpenCreate}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'var(--color-brand-primary)',
              boxShadow: '0 0 0 4px rgba(139, 195, 74, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            title={t.products.createProduct}
          >
            <Plus size={20} />
          </button>
        </Tooltip>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
          {t.products.title} / {products.length}
        </h1>

        {/* Contextual Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            border: '1px solid var(--color-border-card)',
            borderRadius: 4,
            padding: '0 12px',
            height: 34,
            width: 250,
            maxWidth: '100%',
            boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
          }}
        >
          <Search size={15} style={{ color: '#90a4ae', marginRight: 8, flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.products.searchPlaceholder}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: 13,
              color: 'var(--color-text-primary)',
              background: 'transparent',
            }}
          />
        </div>

        {/* Filter 1: Type (CustomSelect with Action to Create Type) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {t.products.type}
          </label>
          <CustomSelect
            options={typeOptions}
            value={selectedType}
            onChange={(val) => dispatch(setSelectedType(val))}
            onActionClick={() => setIsTypeModalOpen(true)}
            actionLabel={t.products.createTypeAction}
            style={{ width: 200 }}
          />
          <Tooltip content={t.products.createTypeTooltip}>
            <button
              type="button"
              onClick={() => setIsTypeModalOpen(true)}
              style={{
                height: 34,
                padding: '0 10px',
                borderRadius: 4,
                border: '1px solid var(--color-border-card)',
                background: '#ffffff',
                color: 'var(--color-brand-modal-footer)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Tag size={13} />
              <span>{t.products.createTypeBtn}</span>
            </button>
          </Tooltip>
        </div>

        {/* Filter 2: Specification (CustomSelect) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500 }}>
            {t.products.specification}
          </label>
          <CustomSelect
            options={specOptions}
            value={selectedSpecification}
            onChange={(val) => dispatch(setSelectedSpecification(val))}
            style={{ width: 220 }}
          />
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
        {/* Table column headers for Optimized Grid View (locked 8 tracks matching ProductRow) */}
        {viewMode === 'optimized-grid' && (
          <div
            style={{
              width: 1434,
              maxWidth: '100%',
              padding: '0 24px 8px',
              display: 'grid',
              gridTemplateColumns:
                '24px 50px minmax(280px, 2.4fr) 140px 150px 150px minmax(220px, 1.8fr) 76px',
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
            <span>{t.products.colTitle}</span>
            <span>{t.products.colStatus}</span>
            <span>{t.products.colGuarantee}</span>
            <span>{t.products.colPrice}</span>
            <span>{t.products.colBinding}</span>
            <span style={{ textAlign: 'right' }}>{t.products.colActions}</span>
          </div>
        )}

        {/* Table column headers for Classic Scroll View */}
        {viewMode === 'classic-scroll' && (
          <div
            style={{
              width: 2542,
              padding: '0 28px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 32,
              fontSize: 11,
              fontWeight: 700,
              color: '#90a4ae',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              flexShrink: 0,
            }}
          >
            <span style={{ width: 10, flexShrink: 0 }} />
            <span style={{ width: 50, flexShrink: 0 }} />
            <span style={{ width: 380, flexShrink: 0 }}>{t.products.colTitle}</span>
            <span style={{ width: 110, flexShrink: 0 }}>{t.products.colStatus}</span>
            <span style={{ width: 140, flexShrink: 0 }}>{t.products.colGuarantee}</span>
            <span style={{ width: 90, flexShrink: 0 }}>{t.products.condition}</span>
            <span style={{ width: 150, flexShrink: 0 }}>{t.products.colPrice}</span>
            <span style={{ width: 320, flexShrink: 0 }}>{t.groups.title}</span>
            <span style={{ width: 240, flexShrink: 0 }}>{t.users.title}</span>
            <span style={{ width: 320, flexShrink: 0 }}>{t.orders.title}</span>
            <span style={{ width: 130, flexShrink: 0, textAlign: 'center' }}>
              {t.orders.colDate}
            </span>
            <span style={{ width: 76, flexShrink: 0, textAlign: 'right' }}>
              {t.products.colActions}
            </span>
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
                onEditClick={handleOpenEdit}
                onDeleteClick={handleOpenDelete}
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
              {t.products.empty}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal for Products */}
      <DeleteConfirmModal
        product={productToDelete}
        isOpen={Boolean(productToDelete)}
        onClose={() => dispatch(setProductToDelete(null))}
        onConfirm={handleConfirmDelete}
        loading={isDeleting}
      />

      {/* Product Form Modal (Create & Edit) */}
      <ProductFormModal
        product={productToEdit}
        orders={orders}
        availableTypes={types}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          dispatch(setProductToEdit(null));
        }}
        onSubmit={handleSaveProduct}
      />

      {/* Type Create Modal */}
      <TypeCreateModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSubmit={handleCreateType}
      />
    </div>
  );
}
