'use client';

import * as React from 'react';
import Link from 'next/link';
import { m, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import type { Product } from '@/types';
import type { PriceLevel } from '@/lib/auth/carlin-session';

export interface NovedadesSectionProps {
  products: Product[];
  priceLevel: PriceLevel;
}

/**
 * "Nuevos Lanzamientos" — antes se mostraba como "Novedades".
 * Solo cambia la etiqueta visible: los datos siguen siendo los últimos
 * productos creados, y la grilla reutiliza la tarjeta compartida.
 */
export function NovedadesSection({ products, priceLevel }: NovedadesSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!products || products.length === 0) return null;

  return (
    <m.section
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-7xl px-4 py-16 md:px-8"
    >
      <SectionHeader
        title="Nuevos Lanzamientos"
        subtitle="Lo último que ha llegado a nuestro catálogo."
      />

      <ProductGrid products={products.slice(0, 8)} priceLevel={priceLevel} />

      <div className="mt-10 flex justify-center">
        <Link
          href="/catalogo"
          className="group inline-flex items-center gap-2 rounded-xl border border-brand-pink px-6 py-3 text-sm font-bold uppercase tracking-[1px] text-brand-pink-dark transition-colors hover:bg-brand-pink hover:text-white"
        >
          Ver todo el catálogo
          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      </div>
    </m.section>
  );
}
