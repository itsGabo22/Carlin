'use client';

import * as React from 'react';
import { ProductCard } from './ProductCard';
import { HorizontalCarousel } from '@/components/shared/HorizontalCarousel';
import type { PriceLevel } from '@/lib/auth/carlin-session';
import type { Product } from '@/types';

export interface ProductCarouselProps {
  products: Product[];
  priceLevel: PriceLevel;
  /** Milisegundos entre avances automáticos. */
  autoScrollMs?: number;
}

/**
 * Fila horizontal de productos que avanza sola.
 *
 * Reutiliza la MISMA `ProductCard` que la grilla del catálogo: aquí solo cambia
 * la disposición (fila con scroll) y el movimiento, no el diseño de la tarjeta.
 */
export function ProductCarousel({ products, priceLevel, autoScrollMs = 4000 }: ProductCarouselProps) {
  if (!products.length) return null;

  return (
    <HorizontalCarousel
      autoScrollMs={autoScrollMs}
      ariaLabel="Productos más vendidos"
      // El padding lateral deja aire para que las flechas no tapen las tarjetas.
      trackClassName="gap-4 px-1 sm:gap-6 sm:px-12"
    >
      {products.map((product, idx) => (
        <div
          key={product.id}
          className="w-[65%] shrink-0 snap-start sm:w-[45%] lg:w-[30%] xl:w-[23%]"
        >
          <ProductCard product={product} priceLevel={priceLevel} isPriority={idx < 4} />
        </div>
      ))}
    </HorizontalCarousel>
  );
}
