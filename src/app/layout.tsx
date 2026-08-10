import type { Metadata } from 'next';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// Reuse Cormorant Garamond for display
const cormorantDisplay = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
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
      className={`${dmSans.variable} ${cormorant.variable} ${cormorantDisplay.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="flex min-h-full flex-col bg-white text-brand-text overflow-x-hidden">
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
