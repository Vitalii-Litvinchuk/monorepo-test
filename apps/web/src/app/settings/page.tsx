'use client';

import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setLanguage, Language } from '../../store/slices/ui-slice';
import { demoLoginThunk, logout } from '../../store/slices/auth-slice';
import { ViewModeToggle } from '../../components/view-mode-toggle';
import { getApiUrl } from '../../utils/url';

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const currentLang = useAppSelector((state) => state.ui.language);

  const languages: { code: Language; label: string }[] = [
    { code: 'ru', label: 'Русский (RU)' },
    { code: 'ua', label: 'Українська (UA)' },
    { code: 'en', label: 'English (EN)' },
  ];

  return (
    <div style={{ maxWidth: 780, display: 'flex', flexDirection: 'column', gap: 28 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)' }}>
        Настройки приложения
      </h1>

      {/* 1. Language i18n */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #cfd8dc',
          borderRadius: 4,
          padding: '24px 28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2c3c44', marginBottom: 12 }}>
          Язык интерфейса (i18n)
        </h3>
        <p style={{ fontSize: 13, color: '#546e7a', marginBottom: 16 }}>
          Выберите язык для отображения дат, валют и локализованных заголовков.
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => dispatch(setLanguage(l.code))}
              style={{
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid',
                borderColor: currentLang === l.code ? '#8bc34a' : '#cfd8dc',
                background: currentLang === l.code ? '#8bc34a' : '#ffffff',
                color: currentLang === l.code ? '#ffffff' : '#546e7a',
                transition: 'all 0.15s',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Table display mode */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #cfd8dc',
          borderRadius: 4,
          padding: '24px 28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2c3c44', marginBottom: 12 }}>
          Режим отображения таблицы продуктов
        </h3>
        <p style={{ fontSize: 13, color: '#546e7a', marginBottom: 16 }}>
          Оптимизированный адаптивный вид (1434px без скролла) либо классический вид с оригинального скриншота (2542px).
        </p>
        <ViewModeToggle />
      </div>

      {/* 3. Authentication & Account */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #cfd8dc',
          borderRadius: 4,
          padding: '24px 28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2c3c44', marginBottom: 12 }}>
          Google OAuth 2.0 & Профиль
        </h3>
        <p style={{ fontSize: 13, color: '#546e7a', marginBottom: 16 }}>
          Токен авторизации сохраняется в <code>localStorage</code> и передается через заголовок <code>Authorization: Bearer</code>.
        </p>

        {isAuthenticated && user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 14, color: '#2c3c44' }}>
              Вы вошли как: <strong>{user.fullName}</strong> ({user.email})
            </div>
            <div style={{ fontSize: 12, color: '#8bc34a', fontWeight: 600 }}>
              Роль: {user.role}
            </div>
            <div>
              <button
                type="button"
                onClick={() => dispatch(logout())}
                style={{
                  padding: '8px 16px',
                  borderRadius: 4,
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#f44336',
                  color: '#ffffff',
                }}
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={() => dispatch(demoLoginThunk())}
              style={{
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600,
                background: '#8bc34a',
                color: '#ffffff',
              }}
            >
              Demo Google Login
            </button>

            <a
              href={getApiUrl('/api/auth/google')}
              style={{
                padding: '8px 16px',
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 600,
                background: '#4285f4',
                color: '#ffffff',
                textDecoration: 'none',
              }}
            >
              Войти через Google OAuth
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
