'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/layout/MobileNav';
import type { Category, Brand } from '@/types';
import type { SessionResult } from '@/lib/auth/carlin-session';
import { useCartStore } from '@/stores/cartStore';
import { SearchIcon, CartIcon, ProfileIcon } from '@/components/icons/CarlinIcons';
import { useSessionStore } from '@/stores/sessionStore';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

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

  const router = useRouter();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);

  const { priceLevel } = useSessionStore();
  const isWholesale = priceLevel === 'wholesale' || priceLevel === 'distributor';

  React.useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchOpen]);

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
            type="button"
            className="lg:hidden flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer -ml-2 text-brand-text hover:text-brand-pink-dark transition-colors duration-200"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-nav"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo (Center on mobile, Left on desktop) */}
          <Link href="/" className="flex flex-col items-start leading-none">
            <span
              className="text-2xl text-brand-pink-dark"
              style={{ fontFamily: 'var(--font-pacifico, Pacifico, cursive)' }}
            >
              Carlin
            </span>
            <span className="text-[9px] tracking-[0.3em] uppercase text-brand-pink font-sans -mt-0.5">
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
            <button onClick={() => setSearchOpen(true)} className="p-2 text-brand-text hover:text-brand-pink-dark transition-colors">
              <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            <div className="hidden sm:flex items-center relative">
              {isWholesale && (
                <>
                  <button 
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="p-2 text-brand-text hover:text-brand-pink-dark transition-colors focus-visible:outline-none"
                    aria-label="Menú de perfil"
                  >
                    <ProfileIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                  {profileDropdownOpen && (
                    <div 
                      className="absolute top-full mt-2 right-0 w-48 bg-white rounded-xl shadow-lg border border-brand-pink/20 py-2 z-50"
                      role="menu"
                    >
                      <Link 
                        href="/mayoristas/perfil" 
                        className="block px-4 py-2 text-sm text-brand-text hover:bg-brand-pink-light/30 transition-colors" 
                        onClick={() => setProfileDropdownOpen(false)}
                        role="menuitem"
                      >
                        Mi Perfil
                      </Link>
                      <button 
                        onClick={async () => {
                          await supabase.auth.signOut();
                          setProfileDropdownOpen(false);
                          window.location.reload();
                        }} 
                        className="block w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-pink-light/30 transition-colors"
                        role="menuitem"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <Link href="/carrito" className="p-2 text-brand-text hover:text-brand-pink-dark transition-colors relative">
              <CartIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              {cartItemCountFinal > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 bg-brand-pink text-white text-[10px] font-bold rounded-full">
                  {cartItemCountFinal}
                </span>
              )}
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-brand-cream/95 backdrop-blur-sm flex flex-col">
          {/* Barra de búsqueda */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-brand-pink/20">
            <SearchIcon className="w-5 h-5 text-brand-pink flex-shrink-0" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Buscar productos, marcas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchOpen(false);
                  setSearchQuery('');
                }
              }}
              className="flex-1 bg-transparent text-lg outline-none text-brand-neutral-dark placeholder:text-neutral-400"
              autoComplete="off"
            />
            <button 
              onClick={() => setSearchOpen(false)}
              className="text-neutral-400 hover:text-brand-pink min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors"
              aria-label="Cerrar búsqueda"
            >
              ✕
            </button>
          </div>

          {/* Sugerencias rápidas */}
          <div className="px-4 py-6">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">
              Búsquedas populares
            </p>
            <div className="flex flex-wrap gap-2">
              {['Bases', 'Labiales', 'Sombras', 'Shampoo', 'Cremas'].map(s => (
                <button key={s}
                  onClick={() => {
                    router.push(`/buscar?q=${encodeURIComponent(s)}`);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 rounded-full bg-brand-pink-light text-brand-pink-dark text-sm hover:bg-brand-pink hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <MobileNav 
        isOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
        categories={categoriesTree as any} 
        cartItemCount={cartItemCountFinal} 
      />
    </>
  );
}
