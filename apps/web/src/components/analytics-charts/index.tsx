'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAppSelector } from '../../store';
import { CurrencyCode, ProductCondition } from '@dzencode/contracts';
import { useTranslation } from '../../i18n';

const COLORS = ['#8bc34a', '#546e7a', '#ff9800', '#03a9f4'];

export const AnalyticsCharts: React.FC = () => {
  const { t } = useTranslation();
  const orders = useAppSelector((state) => state.orders.items);
  const products = useAppSelector((state) => state.products.items);

  // Orders value chart data
  const orderChartData = orders.map((o) => {
    const usd = o.totalPrices?.find((p) => p.currencyCode === CurrencyCode.USD)?.value || 0;
    const uah = o.totalPrices?.find((p) => p.currencyCode === CurrencyCode.UAH)?.value || 0;
    return {
      name: o.title.length > 20 ? `${o.title.substring(0, 18)}...` : o.title,
      USD: usd,
      UAH_Thousands: Math.round(uah / 1000),
    };
  });

  // Product condition pie data
  const conditionCounts = {
    [ProductCondition.NEW]: 0,
    [ProductCondition.USED]: 0,
    [ProductCondition.REFURBISHED]: 0,
  };

  products.forEach((p) => {
    if (conditionCounts[p.condition] !== undefined) {
      conditionCounts[p.condition]++;
    }
  });

  const conditionPieData = [
    { name: `${t.products.conditionNew} (NEW)`, value: conditionCounts[ProductCondition.NEW] || 0 },
    { name: `${t.products.conditionUsed} (USED)`, value: conditionCounts[ProductCondition.USED] || 0 },
    { name: `${t.products.conditionRefurbished} (REFURBISHED)`, value: conditionCounts[ProductCondition.REFURBISHED] || 0 },
  ].filter((d) => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div
        style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '4px',
          border: '1px solid #cfd8dc',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2c3c44', marginBottom: '16px' }}>
          {t.analytics.orderSumsTitle}
        </h3>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <BarChart data={orderChartData}>
              <XAxis dataKey="name" stroke="#90a4ae" fontSize={12} />
              <YAxis stroke="#90a4ae" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="USD" fill="#8bc34a" name={t.analytics.sumUsd} radius={[4, 4, 0, 0]} />
              <Bar dataKey="UAH_Thousands" fill="#546e7a" name={t.analytics.sumUah} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          padding: '24px',
          borderRadius: '4px',
          border: '1px solid #cfd8dc',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2c3c44', marginBottom: '16px' }}>
          {t.analytics.conditionDistributionTitle}
        </h3>
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={conditionPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {conditionPieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
