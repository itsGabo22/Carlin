'use client';

import Link from 'next/link';
import { m, useReducedMotion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import { HorizontalCarousel } from '@/components/shared/HorizontalCarousel';

export interface CategoryTile {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
}

/**
 * Franja de categorías de la home.
 *
 * Sigue la referencia de Bloomshell: fotos verticales grandes a **ancho
 * completo, sin separación ni bordes redondeados**, con el nombre en mayúsculas
 * blancas abajo. La diferencia es que aquí la franja **se desplaza sola** hacia
 * la derecha (petición de Gabo; en la referencia es estática).
 *
 * Los círculos son SOLO para subcategorías dentro de una página de categoría
 * (ver SubcategoryCircles).
 *
 * Sin imagen cargada, el mosaico cae a un degradado de marca en vez de dejar un
 * hueco. Ojo: hoy casi ninguna categoría raíz tiene `imageUrl`.
 */
export function CategoryTiles({ categories }: { categories: CategoryTile[] }) {
  const reduceMotion = useReducedMotion();

  if (!categories.length) return null;

  // En escritorio se ven 4 a la vez. Con pocas categorías la franja dejaría un
  // hueco a la derecha y el ciclo del auto-scroll se agotaría enseguida, así
  // que la lista se repite hasta llenar la fila con margen para desplazarse.
  const MIN_TILES = 8;
  const repeats = Math.max(1, Math.ceil(MIN_TILES / categories.length));
  const tiles = Array.from({ length: repeats }, () => categories).flat();

  return (
    <section className="py-12">
      <h2 className="mb-8 text-center font-serif text-3xl font-bold uppercase tracking-[0.08em] text-brand-pink-dark md:text-4xl">
        Categorías
      </h2>

      <m.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <HorizontalCarousel autoScrollMs={3500} ariaLabel="Categorías">
          {tiles.map((cat, i) => (
            <Link
              // La lista va duplicada: el índice desempata las claves repetidas.
              key={`${cat.id}-${i}`}
              href={`/catalogo/${cat.slug}`}
              className="group relative flex aspect-[3/4] w-[62%] shrink-0 snap-start items-end overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white sm:w-1/3 lg:w-1/4"
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
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />

              <h3 className="relative z-10 w-full px-4 pb-6 text-center text-lg font-bold uppercase tracking-[0.1em] text-white drop-shadow-md sm:text-2xl">
                {cat.name}
              </h3>
            </Link>
          ))}
        </HorizontalCarousel>
      </m.div>
    </section>
  );
}
