import type { Metadata } from 'next';
import { Inter, Nunito, Pacifico } from 'next/font/google';
import './globals.css';

import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { ScrollToTopButton } from '@/components/layout/ScrollToTopButton';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const nunito = Nunito({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
});

const pacifico = Pacifico({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CARLIN',
    template: '%s | Carlin Cosméticos',
  },
  description:
    'Catálogo de maquillaje, accesorios y cuidado personal. Precios especiales para mayoristas y distribuidores.',
  keywords: [
    'maquillaje',
    'cosméticos',
    'accesorios',
    'cuidado personal',
    'mayorista',
    'distribuidor',
    'Carlin',
  ],
    icons: {
      icon: [
        { url: '/icon.png', type: 'image/png' },
        { url: '/icon.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: [
        { url: '/icon.png', sizes: '180x180', type: 'image/png' },
      ],
      shortcut: '/icon.png',
    },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${nunito.variable} ${pacifico.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="flex min-h-full flex-col bg-brand-cream text-foreground overflow-x-hidden">
        <main className="flex-1">
          {children}
        </main>
        <ScrollToTopButton />
        <WhatsAppButton />
      </body>
    </html>
  );
}
