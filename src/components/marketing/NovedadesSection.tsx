'use client';

import * as React from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { SectionHeader } from './SectionHeader';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import type { Product } from '@/types';
import type { PriceLevel } from '@/lib/auth/carlin-session';

export interface NovedadesSectionProps {
  products: Product[];
  priceLevel: PriceLevel;
}

export function NovedadesSection({ products, priceLevel }: NovedadesSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!products || products.length === 0) return null;

  return (
    <m.section
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="py-16 px-4 md:px-8 max-w-7xl mx-auto"
    >
      <SectionHeader title="Novedades" subtitle="Lo último que ha llegado a nuestro catálogo." />
      <ProductGrid products={products.slice(0, 8)} priceLevel={priceLevel} />
    </m.section>
  );
}
