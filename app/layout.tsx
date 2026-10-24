import type { Metadata, Viewport } from 'next';
import './globals.css';
import { CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'FUN RUSSIA iOS Connect — Black Russia на iPhone',
  description:
    'Установи DNS-профиль и играй на сервере FUN RUSSIA (185.207.214.14:7785) из официального приложения Black Russia на iOS. Без VPN, безопасно, в один тап.',
  keywords: ['Black Russia', 'FUN RUSSIA', 'iOS', 'DNS', 'DoH', 'mobileconfig', 'SA-MP'],
  openGraph: {
    title: 'FUN RUSSIA iOS Connect',
    description: `Перенаправление iOS-клиентов Black Russia на сервер ${CONFIG.serverIp}:${CONFIG.serverPort}`,
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-brand-dark antialiased">{children}</body>
    </html>
  );
}
