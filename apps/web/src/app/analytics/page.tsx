'use client';

import React, { useEffect, useState } from 'react';
import { AnalyticsCharts } from '../../components/analytics-charts';
import { WarehouseMap } from '../../components/warehouse-map';
import { RelationshipGraph } from '../../components/relationship-graph';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchOrders } from '../../store/slices/orders-slice';
import { fetchProducts } from '../../store/slices/products-slice';
import { Cpu } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function AnalyticsPage() {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products.items);
  const [workerResult, setWorkerResult] = useState<any>(null);
  const { t, formatNumber } = useTranslation();

  useEffect(() => {
    dispatch(fetchOrders());
    dispatch(fetchProducts());
  }, [dispatch]);

  // Execute Web Worker calculation in background thread
  useEffect(() => {
    if (products.length > 0 && typeof window !== 'undefined' && window.Worker) {
      try {
        const workerBlob = new Blob([
          `
          self.onmessage = (e) => {
            const { products } = e.data;
            let totalUah = 0;
            let totalUsd = 0;
            for (const prod of products) {
              if (prod.prices) {
                for (const pr of prod.prices) {
                  if (pr.currencyCode === 'UAH') totalUah += pr.value;
                  else if (pr.currencyCode === 'USD') totalUsd += pr.value;
                }
              }
            }
            self.postMessage({ totalUah, totalUsd, count: products.length });
          };
          `,
        ], { type: 'application/javascript' });

        const worker = new Worker(URL.createObjectURL(workerBlob));
        worker.postMessage({ products });
        worker.onmessage = (e) => {
          setWorkerResult(e.data);
          worker.terminate();
        };
      } catch (err) {
        console.warn('Web Worker initialization error:', err);
      }
    }
  }, [products]);

  return (
    <div style={{ maxWidth: 1434, display: 'flex', flexDirection: 'column', gap: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' }}>
          {t.analytics.title}
        </h1>

        {workerResult && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: '#e8f5e9',
              border: '1px solid #c8e6c9',
              borderRadius: 4,
              fontSize: 12,
              color: '#2e7d32',
              fontWeight: 600,
            }}
          >
            <Cpu size={16} /> {t.analytics.workerAggregation} {workerResult.count} {t.analytics.items} (
            {formatNumber(workerResult.totalUsd || 0)} $ / {formatNumber(workerResult.totalUah || 0)} UAH)
          </div>
        )}
      </div>

      {/* 1. Charts (Junior+) */}
      <AnalyticsCharts />

      {/* 2. Interactive Map (Junior+) */}
      <WarehouseMap />

      {/* 3. Interactive Topology Graph (Middle) */}
      <RelationshipGraph />
    </div>
  );
}
