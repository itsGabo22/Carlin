import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Geist_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-serif',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Brisal by Salvador — Accesorios Premium',
    template: '%s | Brisal by Salvador',
  },
  description:
    'Catálogo virtual de accesorios premium en acero y rodio. Elegancia, calidad y estilo para mayoristas y clientes.',
  keywords: [
    'accesorios',
    'joyería',
    'acero',
    'rodio',
    'premium',
    'mayorista',
    'Brisal',
    'Salvador',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-brand-pearl text-foreground">
        {children}
      </body>
    </html>
  );
}
