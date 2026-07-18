'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, User, ShoppingBag, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/layout/MobileNav';
import type { Category, Brand } from '@/types';
import type { SessionResult } from '@/lib/auth/carlin-session';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';

interface HeaderProps {
  announcementText?: string;
  announcementActive?: boolean;
  categoriesTree: Category[];
  brands: Brand[];
  sessionResult: SessionResult;
  cartItemCount: number; // passed from layout if it reads cookies, or we read from Zustand? Zustand is better for client.
}

export function Header({ announcementText = 'Envíos gratis a todo el país', announcementActive = true, categoriesTree, brands, sessionResult }: HeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  
  const cartItemCountFromStore = useCartStore((state) => state.getItemCount());
  
  // Use either the prop or the store (store preferred for client reactivity)
  const cartItemCountFinal = cartItemCountFromStore;

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20);
  });

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  };

  const makeupCategory = categoriesTree.find(c => c.slug === 'maquillaje-y-accesorios');
  const careCategory = categoriesTree.find(c => c.slug === 'cuidado-facial-y-capilar');

  return (
    <>
      {/* Announcement Bar */}
      {announcementActive && announcementText && (
        <div className="w-full py-2 px-4 text-center font-nunito text-xs sm:text-sm font-semibold tracking-wide bg-brand-pink text-white">
          {announcementText}
        </div>
      )}

      {/* Main Header */}
      <motion.header
        ref={headerRef}
        animate={
          scrolled
            ? { backgroundColor: 'rgba(255, 255, 255, 0.95)' }
            : { backgroundColor: 'rgba(255, 255, 255, 1)' }
        }
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'sticky top-0 z-30 w-full transition-shadow',
          scrolled && 'shadow-sm backdrop-blur-md border-b border-brand-pink-light/30'
        )}
      >
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Mobile Hamburger (Left) */}
          <button
            className="lg:hidden p-2 -ml-2 text-brand-text hover:text-brand-pink-dark transition-colors"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo (Center on mobile, Left on desktop) */}
          <Link
            href="/"
            className="flex flex-col items-center lg:items-start leading-none group"
          >
            <span className="font-pacifico text-2xl sm:text-3xl text-brand-pink-dark group-hover:text-brand-pink transition-colors">
              Carlin
            </span>
            <span className="font-nunito text-[10px] sm:text-xs font-bold tracking-[0.2em] text-brand-text uppercase -mt-1 sm:-mt-2">
              Cosméticos
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {makeupCategory && (
              <div className="relative">
                <button
                  onClick={() => toggleMenu('makeup')}
                  className="font-nunito text-sm font-bold text-brand-text hover:text-brand-pink-dark transition-colors flex items-center gap-1"
                >
                  Maquillaje y Accesorios
                </button>
                {openMenuId === 'makeup' && (
                  <div className="absolute top-full left-0 mt-4 w-[600px] bg-white rounded-2xl shadow-xl border border-brand-pink-light/20 p-6 grid grid-cols-3 gap-6">
                    {makeupCategory.children?.map(sub => (
                      <div key={sub.id} className="flex flex-col gap-2">
                        <Link href={`/catalogo/maquillaje-y-accesorios/${sub.slug}`} className="font-nunito font-bold text-brand-pink-dark hover:underline" onClick={() => setOpenMenuId(null)}>
                          {sub.name}
                        </Link>
                        {/* If children of subcategory exist they would go here */}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {careCategory && (
              <div className="relative">
                <button
                  onClick={() => toggleMenu('care')}
                  className="font-nunito text-sm font-bold text-brand-text hover:text-brand-pink-dark transition-colors flex items-center gap-1"
                >
                  Cuidado Facial y Capilar
                </button>
                {openMenuId === 'care' && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[400px] bg-white rounded-2xl shadow-xl border border-brand-pink-light/20 p-6 flex justify-between gap-6">
                    <div className="flex flex-col gap-3 w-1/2 border-r border-gray-100 pr-4">
                      <span className="font-nunito font-bold text-brand-pink-dark">Cuidado Facial</span>
                      <Link href="/marca/dolce-bella" className="text-sm text-gray-600 hover:text-brand-pink" onClick={() => setOpenMenuId(null)}>Dolce Bella</Link>
                      <Link href="/marca/og" className="text-sm text-gray-600 hover:text-brand-pink" onClick={() => setOpenMenuId(null)}>OG</Link>
                      <Link href="/marca/pin-up-glow" className="text-sm text-gray-600 hover:text-brand-pink" onClick={() => setOpenMenuId(null)}>Pin Up Glow</Link>
                    </div>
                    <div className="flex flex-col gap-3 w-1/2 pl-2">
                      <span className="font-nunito font-bold text-brand-pink-dark">Cuidado Capilar</span>
                      <Link href="/marca/poccion" className="text-sm text-gray-600 hover:text-brand-pink" onClick={() => setOpenMenuId(null)}>Pocción</Link>
                      <Link href="/marca/milagros" className="text-sm text-gray-600 hover:text-brand-pink" onClick={() => setOpenMenuId(null)}>Milagros</Link>
                      <Link href="/marca/anyluz" className="text-sm text-gray-600 hover:text-brand-pink" onClick={() => setOpenMenuId(null)}>Anyluz</Link>
                      <Link href="/marca/kaba" className="text-sm text-gray-600 hover:text-brand-pink" onClick={() => setOpenMenuId(null)}>KABA</Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link
              href="/mayoristas/login"
              className="font-nunito text-sm font-bold bg-brand-pink-dark text-white px-5 py-2 rounded-full hover:bg-brand-pink transition-colors shadow-sm"
            >
              Mayoristas
            </Link>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/buscar" className="p-2 text-brand-text hover:text-brand-pink-dark transition-colors">
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>

            <div className="hidden sm:flex items-center">
              {sessionResult.user ? (
                <div className="flex items-center gap-2 bg-gray-50 pl-2 pr-4 py-1.5 rounded-full border border-gray-100">
                  <User className="w-5 h-5 text-gray-400" />
                  {sessionResult.isActive ? (
                    sessionResult.priceLevel === 'distributor' ? (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold bg-brand-distributor text-white text-[10px]">Precio Distribuidor</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold bg-green-500 text-white text-[10px]">Precio Mayorista</span>
                    )
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold border border-yellow-600 text-yellow-600 text-[10px]">⚠ Inactivo</span>
                  )}
                </div>
              ) : (
                <Link href="/mayoristas/login" className="p-2 text-brand-text hover:text-brand-pink-dark transition-colors">
                  <User className="w-5 h-5 sm:w-6 sm:h-6" />
                </Link>
              )}
            </div>

            <Link href="/carrito" className="p-2 text-brand-text hover:text-brand-pink-dark transition-colors relative">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              {cartItemCountFinal > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-brand-pink-dark text-white text-[10px] font-bold rounded-full">
                  {cartItemCountFinal}
                </span>
              )}
            </Link>
          </div>
        </div>
      </motion.header>

      {/* MobileNav omitted for brevity or needs to be updated too */}
    </>
  );
}
