'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileNav } from '@/components/layout/MobileNav';
import type { Category, Brand } from '@/types';
import type { SessionResult } from '@/lib/auth/carlin-session';
import { useCartStore } from '@/stores/cartStore';
import { useSessionStore } from '@/stores/sessionStore';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { lato } from '@/lib/fonts';
import { Marquee } from '@/components/layout/Marquee';

const NAV_ORDER = ['maquillaje', 'accesorios', 'cuidado-facial', 'cuidado-capilar'];

interface HeaderProps {
  announcementText?: string;
  announcementActive?: boolean;
  categoriesTree: Category[];
  brands: Brand[];
  sessionResult: SessionResult;
  cartItemCount: number;
  marquees?: string[];
  /** @deprecated replaced by catalogMaquillajeUrl + catalogCapilarUrl */
  wholesaleCatalogUrl?: string;
  catalogMaquillajeUrl?: string;
  catalogCapilarUrl?: string;
}

export function Header({
  announcementText = 'Envíos gratis a todo el país',
  announcementActive = true,
  categoriesTree,
  brands,
  sessionResult,
  marquees = [],
  catalogMaquillajeUrl,
  catalogCapilarUrl,
}: HeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const [catalogOpen, setCatalogOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const headerRef = React.useRef<HTMLElement>(null);

  const cartItemCountFinal = useCartStore((state) => state.getItemCount());
  const router = useRouter();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchCategory, setSearchCategory] = React.useState('');

  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);
  const { priceLevel } = useSessionStore();
  const isWholesale = priceLevel === 'wholesale' || priceLevel === 'distributor';

  const hasCatalog = !!(catalogMaquillajeUrl || catalogCapilarUrl);

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setScrolled(latest > 20);
  });

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
        setCatalogOpen(false);
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className={cn(lato.className, "sticky top-0 z-50 w-full")}>
      {/* Announcement Bar — untouched */}
      {announcementActive && announcementText && (
        <div className="w-full py-2 px-4 text-center text-xs sm:text-sm font-semibold tracking-wide bg-brand-pink text-white">
          {announcementText}
        </div>
      )}

      {/* Marquee */}
      {marquees.length > 0 && <Marquee messages={marquees} />}

      {/* Main Header — sticky */}
      <motion.header
        ref={headerRef}
        animate={
          scrolled
            ? { backgroundColor: 'rgba(255, 255, 255, 0.95)' }
            : { backgroundColor: 'rgba(255, 255, 255, 1)' }
        }
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'w-full transition-shadow',
          scrolled && 'shadow-md backdrop-blur-md'
        )}
      >
        {/* ── ROW 1: Logo · Search · Icons ── */}
        <div className="bg-white border-b border-gray-100">
          <div className="mx-auto flex h-[102px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">

            {/* Mobile Hamburger */}
            <button
              type="button"
              className="lg:hidden flex items-center justify-center p-2 text-gray-700"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo — height-bound, natural aspect ratio */}
            <Link href="/" className="flex shrink-0 items-center justify-center h-full py-2">
              <div className="flex flex-col items-center justify-center h-full w-auto px-2">
                <span
                  className="text-4xl text-brand-pink leading-none"
                  style={{ fontFamily: 'var(--font-pacifico, Pacifico, cursive)' }}
                >
                  Carlin
                </span>
                <span className="text-[10px] tracking-[0.3em] uppercase text-brand-pink font-sans mt-0.5">
                  Cosméticos
                </span>
              </div>
            </Link>

            {/* Desktop Search Bar */}
            <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
              <form
                onSubmit={handleSearch}
                className="flex w-full h-[45px] rounded-full border-[0.8px] border-[#FF80B3] overflow-hidden bg-[#FAFAFA]"
              >
                <select
                  className="px-4 text-sm text-gray-600 bg-[#FAFAFA] border-r border-[#FF80B3] outline-none cursor-pointer shrink-0"
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {orderedCategories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="flex-1 px-4 bg-transparent outline-none text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-6 bg-[#FF80B3] text-white font-bold tracking-wider text-sm hover:bg-[#E573A1] transition-colors"
                >
                  Buscar
                </button>
              </form>
            </div>

            {/* Action Icons — always render Lucide; no <img> / NavIcon until real SVGs exist */}
            <div className="flex items-center gap-5 shrink-0">

              {/* Mobile search trigger */}
              <Link
                href="/buscar"
                className="lg:hidden flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#FF80B3] transition-colors"
              >
                <Image src="/icons/nav/search.png" alt="Buscar" width={24} height={24} className="w-6 h-6 object-contain" />
              </Link>

              {/* Profile / Account */}
              <div className="relative">
                <button
                  onClick={() => {
                    setProfileDropdownOpen((o) => !o);
                    setCatalogOpen(false);
                  }}
                  className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#FF80B3] transition-colors"
                >
                  <Image src="/icons/nav/account.png" alt="Cuenta" width={24} height={24} className="w-6 h-6 object-contain" />
                  <span className="text-[10px] uppercase hidden sm:block">Mi Cuenta</span>
                </button>

                {profileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                    {isWholesale ? (
                      <>
                        <Link
                          href="/mayoristas/perfil"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setProfileDropdownOpen(false)}
                        >
                          Mi Perfil
                        </Link>
                        <button
                          onClick={async () => {
                            await supabase.auth.signOut();
                            window.location.reload();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Cerrar sesión
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/mayoristas/login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        Ingreso Mayoristas
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link
                href="/carrito"
                className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#FF80B3] transition-colors relative"
              >
                <div className="relative">
                  <Image src="/icons/nav/cart.png" alt="Carrito" width={24} height={24} className="w-6 h-6 object-contain" />
                  {cartItemCountFinal > 0 && (
                    <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-[#FF80B3] text-white text-[11px] font-bold rounded-full">
                      {cartItemCountFinal}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase hidden sm:block">Carrito</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── ROW 2: Category links (continuous left-aligned, Purpure spacing) ── */}
        <div className="hidden lg:block bg-[#FF80B3]">
          <nav className="max-w-7xl mx-auto flex justify-center items-center h-[50px] px-4">

            {/* Category links */}
            {orderedCategories.map((cat) => {
              const hasChildren = !!cat.children && cat.children.length > 0;
              return (
                <div
                  key={cat.id}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => { setOpenMenuId(cat.id); setCatalogOpen(false); }}
                  onMouseLeave={() => setOpenMenuId(null)}
                >
                  <Link
                    href={`/catalogo/${cat.slug}`}
                    className="text-white text-[14px] font-bold uppercase tracking-wider hover:text-white/80 transition-colors"
                    style={{ padding: '5px 17.5px' }}
                  >
                    {cat.name}
                  </Link>
                  {hasChildren && openMenuId === cat.id && (
                    <div className="absolute top-[50px] left-0 w-64 bg-white shadow-xl border-t-2 border-[#FF80B3] py-2 z-50 flex flex-col">
                      {cat.children!.map((sub) => (
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

            {/* Catálogo Mayorista — flyout with two options (Purpure HAZTE MAYORISTA pattern) */}
            {hasCatalog && (
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => setCatalogOpen(true)}
                onMouseLeave={() => setCatalogOpen(false)}
              >
                <button
                  className="flex items-center gap-2 text-white text-[14px] font-bold uppercase tracking-wider hover:text-white/80 transition-colors"
                  style={{ padding: '5px 17.5px' }}
                >
                  Catálogo Mayorista
                  <span className="bg-[#A99DEA] text-white text-[10px] px-2 py-0.5 rounded uppercase tracking-[0.05em]">
                    VER CATALOGO
                  </span>
                </button>

                {catalogOpen && (
                  <div className="absolute top-[50px] right-0 w-64 bg-white shadow-xl border-t-2 border-[#A99DEA] py-2 z-50 flex flex-col">
                    {catalogMaquillajeUrl && (
                      <a
                        href={catalogMaquillajeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 text-sm text-gray-700 hover:bg-[#FF80B3] hover:text-white transition-colors flex items-center gap-2"
                        onClick={() => setCatalogOpen(false)}
                      >
                        <span className="text-[#A99DEA] font-bold text-xs">VER</span>
                        Catálogo Maquillaje
                      </a>
                    )}
                    {catalogCapilarUrl && (
                      <a
                        href={catalogCapilarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 text-sm text-gray-700 hover:bg-[#FF80B3] hover:text-white transition-colors flex items-center gap-2"
                        onClick={() => setCatalogOpen(false)}
                      >
                        <span className="text-[#A99DEA] font-bold text-xs">VER</span>
                        Catálogo Capilar
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Mayoristas login link — distinct, untouched */}
            <Link
              href="/mayoristas/login"
              className="text-white text-[14px] font-bold uppercase tracking-wider hover:text-white/80 transition-colors"
              style={{ padding: '5px 17.5px' }}
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
