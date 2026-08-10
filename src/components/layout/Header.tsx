'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, Search, User, ShoppingCart, Heart, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/layout/MobileNav';
import type { Category, Brand } from '@/types';
import type { SessionResult } from '@/lib/auth/carlin-session';
import { useCartStore } from '@/stores/cartStore';
import { useSessionStore } from '@/stores/sessionStore';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Lato } from 'next/font/google';
import Image from 'next/image';

import { Marquee } from '@/components/layout/Marquee';

const lato = Lato({ subsets: ['latin'], weight: ['400', '700'] });

const NAV_ORDER = ['maquillaje', 'accesorios', 'cuidado-facial', 'cuidado-capilar'];

interface HeaderProps {
  announcementText?: string;
  announcementActive?: boolean;
  categoriesTree: Category[];
  brands: Brand[];
  sessionResult: SessionResult;
  cartItemCount: number;
  marquees?: string[];
  wholesaleCatalogUrl?: string;
}

// Icon component with fallback to Lucide
function NavIcon({ src, fallback: FallbackIcon }: { src: string, fallback: any }) {
  const [error, setError] = React.useState(false);
  if (error) return <FallbackIcon className="w-6 h-6 text-gray-700" />;
  return (
    <img 
      src={src} 
      alt="icon" 
      className="w-6 h-6 object-contain"
      onError={() => setError(true)} 
    />
  );
}

export function Header({ announcementText = 'Envíos gratis a todo el país', announcementActive = true, categoriesTree, brands, sessionResult, marquees = [], wholesaleCatalogUrl }: HeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  
  const cartItemCountFinal = useCartStore((state) => state.getItemCount());
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchCategory, setSearchCategory] = React.useState('');
  
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const { priceLevel } = useSessionStore();
  const isWholesale = priceLevel === 'wholesale' || priceLevel === 'distributor';

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

  const orderedCategories = React.useMemo(() => {
    return [...categoriesTree].sort((a, b) => {
      const ai = NAV_ORDER.indexOf(a.slug);
      const bi = NAV_ORDER.indexOf(b.slug);
      if (ai === -1 && bi === -1) return a.name.localeCompare(b.name);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [categoriesTree]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className={lato.className}>
      {/* Announcement Bar */}
      {announcementActive && announcementText && (
        <div className="w-full py-2 px-4 text-center text-xs sm:text-sm font-semibold tracking-wide bg-brand-pink text-white">
          {announcementText}
        </div>
      )}

      {/* New Marquee */}
      {marquees.length > 0 && <Marquee messages={marquees} />}

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
          scrolled && 'shadow-md backdrop-blur-md'
        )}
      >
        {/* ROW 1: Logo, Search, Icons */}
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto flex h-[102px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
            
            {/* Mobile Hamburger (Left) */}
            <button
              type="button"
              className="lg:hidden flex items-center justify-center p-2 text-gray-700"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center justify-center h-full py-1">
              {/* Purpure logo sizing constraint: ~98% height, natural aspect ratio */}
              <div className="flex flex-col items-center justify-center h-[98%] w-auto bg-white px-2">
                <span className="text-4xl text-brand-pink" style={{ fontFamily: 'var(--font-pacifico, Pacifico, cursive)' }}>Carlin</span>
                <span className="text-[10px] tracking-[0.3em] uppercase text-brand-pink font-sans -mt-1">Cosméticos</span>
              </div>
            </Link>

            {/* Desktop Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="flex w-full h-[45px] rounded-full border-[0.8px] border-[#FF80B3] overflow-hidden bg-[#FAFAFA]">
                <select 
                  className="px-4 text-sm text-gray-600 bg-[#FAFAFA] border-r border-[#FF80B3] outline-none cursor-pointer"
                  value={searchCategory}
                  onChange={e => setSearchCategory(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {orderedCategories.map(cat => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
                <input 
                  type="text"
                  placeholder="Buscar productos..."
                  className="flex-1 px-4 bg-transparent outline-none text-sm"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="px-6 bg-[#FF80B3] text-white flex items-center justify-center hover:bg-[#E573A1] transition-colors">
                  <NavIcon src="/icons/nav/search.svg" fallback={Search} />
                </button>
              </form>
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-6 shrink-0">
              {/* Desktop search icon (mobile only) */}
              <button onClick={() => {}} className="lg:hidden p-2 flex flex-col items-center gap-1">
                <NavIcon src="/icons/nav/search.svg" fallback={Search} />
              </button>

              <Link href="/lista-deseos" className="hidden sm:flex flex-col items-center gap-1 group">
                <NavIcon src="/icons/nav/wishlist.svg" fallback={Heart} />
                <span className="text-[10px] uppercase text-gray-500 group-hover:text-[#FF80B3]">Deseos</span>
              </Link>

              <div className="relative">
                <button 
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <NavIcon src="/icons/nav/user.svg" fallback={User} />
                  <span className="text-[10px] uppercase text-gray-500 group-hover:text-[#FF80B3]">Mi Cuenta</span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                    {isWholesale ? (
                      <>
                        <Link href="/mayoristas/perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileDropdownOpen(false)}>Mi Perfil</Link>
                        <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cerrar sesión</button>
                      </>
                    ) : (
                      <Link href="/mayoristas/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setProfileDropdownOpen(false)}>Ingreso Mayoristas</Link>
                    )}
                  </div>
                )}
              </div>

              <Link href="/carrito" className="flex flex-col items-center gap-1 group relative">
                <div className="relative">
                  <NavIcon src="/icons/nav/cart.svg" fallback={ShoppingCart} />
                  {cartItemCountFinal > 0 && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-[#FF80B3] text-white text-[11px] font-bold rounded-full">
                      {cartItemCountFinal}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase text-gray-500 group-hover:text-[#FF80B3]">Carrito</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ROW 2: Categories Menu */}
        <div className="hidden lg:block bg-[#FF80B3]">
          <nav className="max-w-7xl mx-auto flex items-center justify-center h-[50px] gap-8 px-4">
            {orderedCategories.map(cat => {
              const hasChildren = !!cat.children && cat.children.length > 0;

              return (
                <div key={cat.id} className="relative h-full flex items-center" onMouseEnter={() => setOpenMenuId(cat.id)} onMouseLeave={() => setOpenMenuId(null)}>
                  <Link
                    href={`/catalogo/${cat.slug}`}
                    className="text-white text-[14px] font-bold uppercase tracking-wider hover:text-white/80 transition-colors"
                  >
                    {cat.name}
                  </Link>
                  {hasChildren && openMenuId === cat.id && (
                    <div className="absolute top-[50px] left-0 w-64 bg-white shadow-xl border-t-2 border-[#FF80B3] py-2 z-50 flex flex-col">
                      {cat.children!.map(sub => (
                        <Link
                          key={sub.id}
                          href={`/catalogo/${cat.slug}/${sub.slug}`}
                          className="px-4 py-3 text-sm text-gray-700 hover:bg-[#FF80B3] hover:text-white transition-colors"
                          onClick={() => setOpenMenuId(null)}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {wholesaleCatalogUrl && (
              <a
                href={wholesaleCatalogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white text-[14px] font-bold uppercase tracking-wider hover:text-white/80 transition-colors ml-4"
              >
                Catálogo Mayorista
                <span className="bg-[#A99DEA] text-white text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                  VER CATALOGO
                </span>
              </a>
            )}

            <Link
              href="/mayoristas/login"
              className="text-white text-[14px] font-bold uppercase tracking-wider hover:text-white/80 transition-colors ml-auto"
            >
              Mayoristas
            </Link>
          </nav>
        </div>
      </motion.header>

      <MobileNav 
        isOpen={mobileNavOpen} 
        onClose={() => setMobileNavOpen(false)} 
        categories={categoriesTree as any} 
        cartItemCount={cartItemCountFinal} 
      />
    </div>
  );
}
