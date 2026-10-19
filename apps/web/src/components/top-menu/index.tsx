'use client';

import React, { useEffect, useState } from 'react';
import { Clock, Shield } from 'lucide-react';
import styles from './top-menu.module.scss';
import { useAppDispatch, useAppSelector } from '../../store';
import { setActiveSessionsCount } from '../../store/slices/session-slice';
import { setGlobalSearch } from '../../store/slices/ui-slice';
import { demoLoginThunk, logout } from '../../store/slices/auth-slice';
import { getSocketClient, WS_EVENTS } from '../../services/socket-client';

export const TopMenu: React.FC = () => {
  const dispatch = useAppDispatch();
  const activeSessionsCount = useAppSelector(
    (state) => state.session.activeSessionsCount,
  );
  const globalSearch = useAppSelector((state) => state.ui.globalSearch);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

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

  const formatDayOfWeek = (date: Date) => {
    const daysRu = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    return daysRu[date.getDay()];
  };

  const formatDateString = (date: Date) => {
    const monthsRu = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthsRu[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  };

  const formatTimeString = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

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
            placeholder="Поиск"
            value={globalSearch}
            onChange={(e) => dispatch(setGlobalSearch(e.target.value))}
          />
        </form>
      </div>

      <div className={styles.rightSection}>
        <div className={styles.timeContainer}>
          <span className={styles.dayOfWeek}>
            {currentTime ? formatDayOfWeek(currentTime) : '...'}
          </span>
          <div className={styles.dateTimeRow}>
            <span className={styles.dateText}>
              {currentTime ? formatDateString(currentTime) : '...'}
            </span>
            <Clock className={styles.clockIcon} />
            <span className={`${styles.timeText} tabular-nums`}>
              {currentTime ? formatTimeString(currentTime) : '...'}
            </span>
          </div>
        </div>

        <div className={styles.sessionBadge} title="Количество активных вкладок приложения в реальном времени">
          <span className={styles.sessionDot} />
          <span>{activeSessionsCount} active</span>
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
              Выйти
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={styles.authButton}
              onClick={() => dispatch(demoLoginThunk())}
              title="Войти в демо-режиме (без Google Cloud ключей)"
            >
              Demo Google Login
            </button>
            <a
              href="http://localhost:4000/api/auth/google"
              className={styles.authButton}
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
              title="Войти через Google OAuth 2.0"
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
