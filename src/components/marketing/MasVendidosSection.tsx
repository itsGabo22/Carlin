'use client';

import * as React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { SectionHeader } from './SectionHeader';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import type { Product } from '@/types';
import type { PriceLevel } from '@/lib/auth/carlin-session';

export interface MasVendidosSectionProps {
  products: Product[];
  priceLevel: PriceLevel;
}

/**
 * "Más Vendidos". Va sobre fondo rosa muy claro para separarla visualmente de
 * "Nuevos Lanzamientos", que queda sobre blanco. Misma tarjeta compartida.
 */
export function MasVendidosSection({ products, priceLevel }: MasVendidosSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!products || products.length === 0) return null;

  return (
    <div className="bg-brand-cream/35">
      <m.section
        initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-7xl px-4 py-16 md:px-8"
      >
        <SectionHeader
          title="Más Vendidos"
          subtitle="Descubre nuestros productos estrella, favoritos de los clientes."
        />
        <ProductGrid products={products.slice(0, 8)} priceLevel={priceLevel} />
      </m.section>
    </div>
  );
}
