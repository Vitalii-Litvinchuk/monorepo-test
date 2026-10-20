'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/api-client';
import { User } from '@dzencode/contracts';
import { UserCheck } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { getStaticUrl } from '../../utils/url';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    apiClient.getUsers().then((data) => {
      setUsers(data);
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
        {t.users.title} / {users.length}
      </h1>

      {loading ? (
        <div style={{ color: '#90a4ae' }}>{t.users.loading}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                background: '#ffffff',
                border: '1px solid #cfd8dc',
                borderRadius: 4,
                padding: '24px 28px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getStaticUrl(u.avatarUrl)}
                alt={u.fullName}
                style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/avatar.png';
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#2c3c44' }}>
                  {u.fullName}
                </span>
                <span style={{ fontSize: 12, color: '#90a4ae', marginTop: 2 }}>
                  {u.email}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#8bc34a',
                    marginTop: 6,
                  }}
                >
                  <UserCheck size={13} /> {t.users.role} {u.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
