'use client';

import * as React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { HorizontalCarousel } from '@/components/shared/HorizontalCarousel';

export interface InstagramPostTile {
  id: string;
  imageUrl: string;
  linkUrl: string;
}

export interface InstagramSectionProps {
  posts: InstagramPostTile[];
  /** Usuario que se muestra bajo el título. */
  handle?: string;
}

/**
 * Franja "Síguenos en Instagram".
 *
 * NO consume la API de Instagram a propósito (ver el modelo `InstagramPost`):
 * las entradas se cargan desde /admin, cada una con su imagen y el enlace al
 * post real. Siguiendo la referencia, el corazón aparece **al pasar el mouse**,
 * no fijo.
 */
export function InstagramSection({ posts, handle = '@carlin_cosmeticos' }: InstagramSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  // Sin entradas no se pinta nada: mejor que una franja vacía en la home.
  if (!posts || posts.length === 0) return null;

  // En escritorio se ven 6 a la vez. Con menos fotos que eso la franja dejaría
  // un hueco blanco a la derecha, así que la lista se repite hasta llenar la
  // fila y dejar margen para desplazarse.
  const MIN_TILES = 12;
  const repeats = Math.max(1, Math.ceil(MIN_TILES / posts.length));
  const tiles = Array.from({ length: repeats }, () => posts).flat();

  return (
    <m.section
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="py-16"
    >
      <div className="mb-8 px-4 text-center">
        <h2 className="font-serif text-3xl font-bold uppercase tracking-[0.08em] text-brand-pink-dark md:text-4xl">
          Síguenos en Instagram
        </h2>
        <p className="mt-2 font-sans text-xs uppercase tracking-[0.3em] text-brand-text">
          {handle}
        </p>
      </div>

      <HorizontalCarousel autoScrollMs={3000} ariaLabel="Publicaciones de Instagram">
        {tiles.map((post, i) => (
          <a
            // La lista va duplicada: el índice desempata las claves repetidas.
            key={`${post.id}-${i}`}
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-[4/5] w-[52%] shrink-0 snap-start overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white sm:w-1/4 lg:w-1/6"
            aria-label="Ver publicación en Instagram"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.imageUrl}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            {/* Velo + corazón: solo al pasar el mouse, como en la referencia. */}
            <div className="absolute inset-0 bg-brand-pink/0 transition-colors duration-300 group-hover:bg-brand-pink/25" />
            <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 scale-75 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
              <Heart className="h-5 w-5 fill-brand-pink-dark text-brand-pink-dark" />
            </span>
          </a>
        ))}
      </HorizontalCarousel>
    </m.section>
  );
}
