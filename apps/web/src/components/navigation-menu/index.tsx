'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import styles from './navigation-menu.module.scss';
import { useAppSelector } from '../../store';

export const NavigationMenu: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);

  const navLinks = [
    { href: '/orders', label: 'ПРИХОД' },
    { href: '/groups', label: 'ГРУППЫ' },
    { href: '/products', label: 'ПРОДУКТЫ' },
    { href: '/users', label: 'ПОЛЬЗОВАТЕЛИ' },
    { href: '/analytics', label: 'АНАЛИТИКА' },
    { href: '/settings', label: 'НАСТРОЙКИ' },
  ];

  const avatarSrc = user?.avatarUrl || '/static/7c9e6679-7425-40de-944b-e07fc1f90ae7.png';

  return (
    <nav className={styles.sidebar}>
      <div className={styles.profileContainer}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt={user?.fullName || 'User Avatar'}
          className={styles.avatarImage}
        />
        <Link
          href="/settings"
          className={styles.settingsButton}
          title="Настройки пользователя"
        >
          <Settings size={18} />
        </Link>
      </div>

      <ul className={styles.navList}>
        {navLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href} className={styles.navItem}>
              <Link
                href={link.href}
                className={`${styles.navLink} ${isActive ? styles.activeLink : ''}`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default NavigationMenu;
