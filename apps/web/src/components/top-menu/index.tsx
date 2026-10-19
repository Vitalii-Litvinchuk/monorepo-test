'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Shield } from 'lucide-react';
import styles from './top-menu.module.scss';
import { useAppDispatch, useAppSelector } from '../../store';
import { setActiveSessionsCount } from '../../store/slices/session-slice';
import { setGlobalSearch } from '../../store/slices/ui-slice';
import { demoLoginThunk, logout } from '../../store/slices/auth-slice';
import { getSocketClient, WS_EVENTS } from '../../services/socket-client';
import { getApiUrl } from '../../utils/url';
import { useTranslation, Language } from '../../i18n';

export const TopMenu: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeSessionsCount = useAppSelector(
    (state) => state.session.activeSessionsCount,
  );
  const globalSearch = useAppSelector((state) => state.ui.globalSearch);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const {
    t,
    currentLang,
    changeLanguage,
    formatDayOfWeek,
    formatDateFull,
    formatTime,
  } = useTranslation();

  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Real-time ticking clock
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebSocket active tabs / sessions counter
  useEffect(() => {
    const socket = getSocketClient();
    if (socket) {
      socket.on(
        WS_EVENTS.SESSIONS_COUNT_UPDATED,
        (data: { activeCount: number }) => {
          if (data && typeof data.activeCount === 'number') {
            dispatch(setActiveSessionsCount(data.activeCount));
          }
        },
      );
    }
  }, [dispatch]);

  const languages: { code: Language; label: string }[] = [
    { code: 'ru', label: 'RU' },
    { code: 'ua', label: 'UA' },
    { code: 'en', label: 'EN' },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <Shield size={28} />
          </div>
          <span className={styles.logoText}>INVENTORY</span>
        </div>

        <form
          className={styles.searchForm}
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t.topMenu.searchPlaceholder}
            value={globalSearch}
            onChange={(e) => dispatch(setGlobalSearch(e.target.value))}
          />
        </form>
      </div>

      <div className={styles.rightSection}>
        {/* Quick Language Switcher */}
        <div className={styles.langSwitch}>
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`${styles.langBtn} ${currentLang === l.code ? styles.activeLang : ''}`}
              onClick={() => changeLanguage(l.code)}
              title={`Switch language to ${l.code.toUpperCase()}`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className={styles.timeContainer}>
          <span className={styles.dayOfWeek}>
            {currentTime ? formatDayOfWeek(currentTime) : '...'}
          </span>
          <div className={styles.dateTimeRow}>
            <span className={styles.dateText}>
              {currentTime ? formatDateFull(currentTime) : '...'}
            </span>
            <Clock className={styles.clockIcon} />
            <span className={`${styles.timeText} tabular-nums`}>
              {currentTime ? formatTime(currentTime) : '...'}
            </span>
          </div>
        </div>

        <div className={styles.sessionBadge} title={t.topMenu.activeSessionsTitle}>
          <span className={styles.sessionDot} />
          <span>{activeSessionsCount} {t.topMenu.active}</span>
        </div>

        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#546e7a', fontWeight: 600 }}>
              {user.fullName}
            </span>
            <button
              className={styles.logoutButton}
              onClick={() => dispatch(logout())}
            >
              {t.topMenu.logout}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={styles.authButton}
              onClick={() => dispatch(demoLoginThunk())}
              title="Demo login"
            >
              Demo Google Login
            </button>
            <a
              href={getApiUrl('/api/auth/google')}
              className={styles.authButton}
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
              title="Google OAuth 2.0"
            >
              Google OAuth
            </a>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopMenu;
