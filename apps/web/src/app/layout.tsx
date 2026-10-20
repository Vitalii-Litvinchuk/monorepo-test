import type { Metadata } from 'next';
import '../styles/globals.scss';
import { Providers } from './providers';
import { TopMenu } from '../components/top-menu';
import { NavigationMenu } from '../components/navigation-menu';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH
  ? process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/+$/, '')
  : '';

export const metadata: Metadata = {
  title: 'Inventory - Orders & Products',
  description: 'Enterprise Inventory Management System (Orders & Products)',
  manifest: `${basePath}/manifest.json`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <TopMenu />
          <NavigationMenu />
          <main
            style={{
              marginLeft: 'var(--sidebar-width)',
              marginTop: 'var(--header-height)',
              minHeight: 'calc(100vh - var(--header-height))',
              padding: '42px 48px',
              backgroundColor: 'var(--color-bg-canvas)',
              position: 'relative',
            }}
          >
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
