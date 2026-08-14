import type { Metadata } from 'next';
import { dmSans, cormorant, lato } from '@/lib/fonts';
import './globals.css';

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
      className={`${dmSans.variable} ${cormorant.variable} ${lato.variable} h-full antialiased overflow-x-hidden`}
      style={{ '--font-display': 'var(--font-serif)' } as React.CSSProperties}
    >
      <body className="flex min-h-full flex-col bg-white text-brand-text overflow-x-hidden">
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
