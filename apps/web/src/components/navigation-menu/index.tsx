'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings } from 'lucide-react';
import styles from './navigation-menu.module.scss';
import { useAppSelector } from '../../store';
import { getStaticUrl } from '../../utils/url';
import { useTranslation } from '../../i18n';

export const NavigationMenu: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const { t } = useTranslation();

  const navLinks = [
    { href: '/orders', label: t.nav.orders },
    { href: '/groups', label: t.nav.groups },
    { href: '/products', label: t.nav.products },
    { href: '/users', label: t.nav.users },
    { href: '/analytics', label: t.nav.analytics },
    { href: '/settings', label: t.nav.settings },
  ];

  const avatarSrc = getStaticUrl(user?.avatarUrl || '7c9e6679-7425-40de-944b-e07fc1f90ae7.png');

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
          title={t.nav.userSettings}
        >
          <Settings size={18} />
        </Link>
      </div>

      <ul className={styles.navList}>
        {navLinks.map((link) => {
          const currentPath = pathname || '';
          const normPath = currentPath.startsWith('/test') ? currentPath.replace(/^\/test/, '') || '/' : currentPath;
          const isActive = normPath === link.href || (normPath && normPath.startsWith(`${link.href}/`));
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
