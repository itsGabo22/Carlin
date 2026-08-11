'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

export interface SubcategoryCircle {
  id: string;
  name: string;
  href: string;
  imageUrl: string | null;
}

/**
 * Fila de círculos de subcategoría (referencia Bloomshell: 140×140,
 * border-radius 122px, imagen + etiqueta debajo).
 *
 * Cada círculo NAVEGA a la URL completa de la subcategoría; no filtra en sitio.
 * En pantallas angostas la fila se desplaza en horizontal con scroll-snap,
 * igual que el carrusel de la referencia pero sin librería.
 */
export function SubcategoryCircles({ items }: { items: SubcategoryCircle[] }) {
  const reduceMotion = useReducedMotion();

  if (!items.length) return null;

  return (
    <nav aria-label="Subcategorías" className="mb-8">
      <ul
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 sm:justify-center sm:flex-wrap sm:overflow-visible"
        style={{ scrollbarWidth: 'thin' }}
      >
        {items.map((item, i) => (
          <li key={item.id} className="snap-start shrink-0">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : i * 0.05 }}
            >
              <Link
                href={item.href}
                className="group flex w-[140px] flex-col items-center gap-2 focus-visible:outline-none"
              >
                <span
                  className="relative flex h-[140px] w-[140px] items-center justify-center overflow-hidden bg-brand-cream/60 ring-2 ring-transparent transition-all duration-300 group-hover:ring-brand-pink group-focus-visible:ring-brand-pink"
                  style={{ borderRadius: '122px' }}
                >
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-brand-pink/30" />
                  )}
                </span>
                <span className="text-center text-xs font-semibold uppercase tracking-wide text-brand-neutral-dark transition-colors group-hover:text-brand-pink-dark">
                  {item.name}
                </span>
              </Link>
            </motion.div>
          </li>
        ))}
      </ul>
    </nav>
  );
}
