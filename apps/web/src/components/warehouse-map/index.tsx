'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../store';
import { useTranslation } from '../../i18n';

export const WarehouseMap: React.FC = () => {
  const { t } = useTranslation();
  const orders = useAppSelector((state) => state.orders.items);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div
        style={{
          height: 380,
          background: '#ffffff',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#90a4ae',
        }}
      >
        {t.analytics.mapLoading}
      </div>
    );
  }

  // Client-rendered interactive map using OpenStreetMap iframe / Leaflet layer
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #cfd8dc',
        borderRadius: 4,
        padding: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2c3c44' }}>
          {t.analytics.mapTitle}
        </h3>
        <p style={{ fontSize: 13, color: '#546e7a', marginTop: 4 }}>
          {t.analytics.mapDesc}
        </p>
      </div>

      <div style={{ position: 'relative', width: '100%', height: 380, borderRadius: 4, overflow: 'hidden' }}>
        <iframe
          title="Warehouse Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          src="https://www.openstreetmap.org/export/embed.html?bbox=23.5%2C46.0%2C31.5%2C51.0&amp;layer=mapnik"
        />
      </div>

      <div
        style={{
          marginTop: 18,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {orders.map((order) => (
          <div
            key={order.id}
            style={{
              padding: '10px 14px',
              background: '#f8fafb',
              border: '1px solid #eaeff2',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 600, color: '#2c3c44' }}>{order.location || t.analytics.centralWarehouse}</div>
            <div style={{ color: '#546e7a', marginTop: 2 }}>{order.title}</div>
            <div style={{ color: '#8bc34a', fontWeight: 600, marginTop: 4 }}>
              {order.productsCount} {t.analytics.productsCountSuffix} • {order.latitude?.toFixed(4)}, {order.longitude?.toFixed(4)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarehouseMap;
