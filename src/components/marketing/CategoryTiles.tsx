'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';

export interface CategoryTile {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

/**
 * Mosaicos de categoría de la home: rectangulares, 4 por fila en escritorio.
 *
 * Los círculos son SOLO para subcategorías dentro de una página de categoría
 * (ver SubcategoryCircles); en la home la referencia usa mosaicos a sangre con
 * el nombre en blanco abajo.
 *
 * Sin imagen cargada, el mosaico cae a un degradado de marca en vez de dejar un
 * hueco — hoy las 40 categorías tienen imageUrl vacío.
 */
export function CategoryTiles({ categories }: { categories: CategoryTile[] }) {
  const reduceMotion = useReducedMotion();

  if (!categories.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <h2 className="mb-8 text-center font-serif text-3xl font-bold text-brand-neutral-dark">
        Categorías
      </h2>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: reduceMotion ? 0 : i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href={`/catalogo/${cat.slug}`}
              className="group relative flex aspect-[4/5] w-full items-end overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2"
              aria-label={`Ver categoría ${cat.name}`}
            >
              {cat.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              ) : (
                <div
                  className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{
                    background:
                      'linear-gradient(150deg, var(--color-brand-pink-light) 0%, var(--color-brand-pink) 55%, var(--color-brand-pink-dark) 100%)',
                  }}
                >
                  <ImageIcon className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/35" />
                </div>
              )}

              {/* Degradado para que el texto se lea sobre cualquier foto */}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/65 to-transparent" />

              <h3 className="relative z-10 w-full px-4 pb-4 text-center text-base font-bold uppercase tracking-[0.12em] text-white drop-shadow-sm sm:text-lg">
                {cat.name}
              </h3>

              {/* Subrayado que aparece al pasar el mouse */}
              <span className="absolute bottom-3 left-1/2 z-10 h-0.5 w-0 -translate-x-1/2 bg-white transition-all duration-300 group-hover:w-12" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
