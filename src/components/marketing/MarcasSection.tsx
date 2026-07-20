'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { m, useReducedMotion } from 'framer-motion';
import { SectionHeader } from './SectionHeader';
import type { Brand } from '@/types';

export interface MarcasSectionProps {
  brands: Brand[];
}

export function MarcasSection({ brands }: MarcasSectionProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!brands || brands.length === 0) return null;

  return (
    <m.section
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="py-16 px-4 md:px-8 overflow-hidden bg-brand-cream/50"
    >
      <SectionHeader title="Nuestras Marcas" subtitle="Las mejores líneas de cuidado y maquillaje." />

      <div className="max-w-7xl mx-auto overflow-hidden">
        <div
          className="flex gap-12 w-max items-center py-6"
          style={{ animation: prefersReducedMotion ? 'none' : 'carlin-marquee 35s linear infinite' }}
        >
          {/* Duplica el array para que el loop sea seamless */}
          {[...brands, ...brands, ...brands].map((brand, i) => (
            <Link key={`${brand.id}-${i}`} href={`/marca/${brand.slug}`} className="flex-shrink-0 group">
              {brand.logoUrl ? (
                <Image 
                  src={brand.logoUrl} 
                  alt={brand.name}
                  width={120} 
                  height={60} 
                  unoptimized
                  className="object-contain grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 drop-shadow-sm"
                />
              ) : (
                <span className="bg-brand-pink-light text-brand-pink-dark font-sans text-sm font-semibold px-6 py-3 rounded-full whitespace-nowrap group-hover:bg-brand-pink group-hover:text-white transition-colors duration-300 shadow-sm">
                  {brand.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </m.section>
  );
}
