'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { X, ChevronDown, Search, ShoppingBag, User } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useSessionStore } from '@/stores/sessionStore';
import { useCartStore } from '@/stores/cartStore';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  cartItemCount: number;
}

export function MobileNav({ isOpen, onClose, categories }: MobileNavProps) {
  const router = useRouter();
  const [openCategories, setOpenCategories] = useState<string[]>([]);
  
  const { priceLevel } = useSessionStore();
  const isWholesale = priceLevel === 'wholesale' || priceLevel === 'distributor';
  const itemCount = useCartStore(s => s.getItemCount());

  const toggleCategory = (id: string) => {
    setOpenCategories(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Trapping focus & handling escape key
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Lock scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {isOpen && (
        <m.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {isOpen && (
        <m.div
          key="drawer"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className="fixed top-0 left-0 bottom-0 w-[300px] z-50 bg-white shadow-2xl shadow-brand-pink/20 flex flex-col overflow-y-auto"
      >
        {/* CABECERA DEL DRAWER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-pink/15">
          {/* Logo */}
          <Link href="/" onClick={onClose} className="flex flex-col leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink rounded-md">
            <span className="text-xl text-brand-pink-dark block" style={{ fontFamily: 'var(--font-display, Pacifico, cursive)' }}>
              Carlin
            </span>
            <span className="text-[8px] tracking-[0.3em] uppercase text-brand-pink font-sans -mt-0.5 block">
              Cosméticos
            </span>
          </Link>

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-400 hover:text-brand-pink transition-colors cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVEGACIÓN PRINCIPAL */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
          {/* Categorías con acordeón */}
          {categories.map((cat) => (
            <div key={cat.id}>
              {cat.children && cat.children.length > 0 ? (
                <>
                  {/* Ítem con dropdown */}
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-left font-sans font-semibold text-brand-neutral-dark hover:bg-brand-pink-light hover:text-brand-pink-dark transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                    aria-expanded={openCategories.includes(cat.id)}
                  >
                    <span>{cat.name}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${openCategories.includes(cat.id) ? 'rotate-180' : ''}`} />
                  </button>
                  {/* Subcategorías */}
                  {openCategories.includes(cat.id) && (
                    <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l-2 border-brand-pink/20 pl-3">
                      {cat.children.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/catalogo/${cat.slug}/${sub.slug}`}
                          onClick={onClose}
                          className="py-2 px-2 text-sm text-neutral-600 hover:text-brand-pink-dark transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                        >
                          {sub.name}
                        </Link>
                      ))}
                      <Link
                        href={`/catalogo/${cat.slug}`}
                        onClick={onClose}
                        className="py-2 px-2 text-sm text-brand-pink font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                      >
                        Ver todo →
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={`/catalogo/${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center px-3 py-3 rounded-xl font-sans font-semibold text-brand-neutral-dark hover:bg-brand-pink-light hover:text-brand-pink-dark transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
                >
                  {cat.name}
                </Link>
              )}
            </div>
          ))}

          {/* Separador */}
          <div className="my-3 border-t border-brand-pink/15" />

          {/* Links secundarios */}
          <Link href="/buscar" onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-600 hover:bg-brand-pink-light hover:text-brand-pink-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink">
            <Search className="w-4 h-4 flex-shrink-0" />
            <span className="font-sans text-sm">Buscar</span>
          </Link>

          <Link href="/carrito" onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-600 hover:bg-brand-pink-light hover:text-brand-pink-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink">
            <ShoppingBag className="w-4 h-4 flex-shrink-0" />
            <span className="font-sans text-sm flex items-center">
              Carrito 
              {itemCount > 0 && (
                <span className="ml-1 bg-brand-pink text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none min-w-[16px] text-center flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </span>
          </Link>

          {/* Perfil — solo si hay sesión de mayorista */}
          {isWholesale && (
            <Link href="/mayoristas/perfil" onClick={onClose} className="flex items-center gap-3 px-3 py-3 rounded-xl text-neutral-600 hover:bg-brand-pink-light hover:text-brand-pink-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="font-sans text-sm">Mi perfil</span>
            </Link>
          )}
        </nav>

        {/* FOOTER DEL DRAWER — CTA de mayoristas */}
        <div className="px-4 py-5 border-t border-brand-pink/15 bg-brand-pink-light/40 mt-auto">
          {isWholesale ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                onClose();
                router.refresh();
              }}
              className="w-full py-2.5 rounded-xl border border-brand-pink/40 text-brand-pink text-sm font-semibold hover:bg-brand-pink hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink"
            >
              Cerrar sesión
            </button>
          ) : (
            <Link href="/registro-mayorista" onClick={onClose} className="block w-full py-2.5 rounded-xl text-center bg-brand-pink text-white text-sm font-semibold hover:bg-brand-pink-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink">
              🎀 Registrarme como mayorista
            </Link>
          )}
        </div>
      </m.div>
      )}
      </AnimatePresence>
    </LazyMotion>
  );
}
