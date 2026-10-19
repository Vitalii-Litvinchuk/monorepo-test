'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api-client';
import { Group } from '@dzencode/contracts';
import { Folder } from 'lucide-react';
import { useTranslation } from '../../i18n';

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    apiClient.getGroups().then((data) => {
      setGroups(data);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ maxWidth: 1434 }}>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--color-text-primary)',
          marginBottom: 32,
        }}
      >
        {t.groups.title} / {groups.length}
      </h1>

      {loading ? (
        <div style={{ color: '#90a4ae' }}>{t.groups.loading}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {groups.map((group) => (
            <div
              key={group.id}
              style={{
                background: '#ffffff',
                border: '1px solid #cfd8dc',
                borderRadius: 4,
                padding: '24px 28px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 4,
                    background: '#f0f3f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#546e7a',
                  }}
                >
                  <Folder size={20} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2c3c44' }}>
                  {group.title}
                </h3>
              </div>

              <p style={{ fontSize: 13, color: '#546e7a' }}>{group.description}</p>

              <div
                style={{
                  marginTop: 'auto',
                  paddingTop: 12,
                  borderTop: '1px solid #eaeff2',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#8bc34a',
                }}
              >
                {t.groups.productsInGroup} {group.productsCount}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
