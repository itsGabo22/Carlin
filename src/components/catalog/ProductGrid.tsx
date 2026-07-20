'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { m, useReducedMotion, Variants } from 'framer-motion';
import { ProductCard } from './ProductCard';
import { SearchX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PriceLevel } from '@/lib/auth/carlin-session';
import type { Product } from '@/types';

export interface ProductGridProps {
  products: Product[];
  priceLevel: PriceLevel;
  pagination?: {
    total: number;
    page: number;
    pages: number;
    pageSize: number;
  };
  emptyMessage?: string;
  className?: string;
}

export function ProductGrid({
  products,
  priceLevel,
  pagination,
  emptyMessage = "No encontramos productos con estos filtros.",
  className
}: ProductGridProps) {
  const searchParams = useSearchParams();
  const prefersReducedMotion = useReducedMotion();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in duration-500">
        <div className="bg-brand-pink-light/20 p-6 rounded-full mb-6">
          <SearchX className="w-12 h-12 text-brand-pink-dark/50" />
        </div>
        <h3 className="text-xl font-nunito font-semibold text-gray-900 mb-2">Ups, no hay resultados</h3>
        <p className="text-gray-500 max-w-md">{emptyMessage}</p>
      </div>
    );
  }

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.07 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
    }
  };

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      <m.div
        variants={containerVariants}
        initial={prefersReducedMotion ? "show" : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
      >
        {products.map((product, idx) => (
          <m.div key={product.id} variants={prefersReducedMotion ? {} : itemVariants}>
            <ProductCard
              product={product}
              priceLevel={priceLevel}
              isPriority={idx < 4}
            />
          </m.div>
        ))}
      </m.div>

      {/* Pagination Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4 py-8 border-t border-gray-100 mt-8">
          {pagination.page > 1 ? (
            <PaginationLink page={pagination.page - 1} searchParams={searchParams}>
              &larr; Anterior
            </PaginationLink>
          ) : (
            <span className="text-gray-300 cursor-not-allowed text-sm font-medium px-3 py-2">&larr; Anterior</span>
          )}

          <span className="text-sm text-gray-500 font-medium">
            Página {pagination.page} de {pagination.pages}
          </span>

          {pagination.page < pagination.pages ? (
            <PaginationLink page={pagination.page + 1} searchParams={searchParams}>
              Siguiente &rarr;
            </PaginationLink>
          ) : (
            <span className="text-gray-300 cursor-not-allowed text-sm font-medium px-3 py-2">Siguiente &rarr;</span>
          )}
        </div>
      )}
    </div>
  );
}

function PaginationLink({ page, searchParams, children }: { page: number, searchParams: URLSearchParams, children: React.ReactNode }) {
  const params = new URLSearchParams(searchParams);
  params.set('page', page.toString());
  
  return (
    <Link
      href={`?${params.toString()}`}
      className="text-brand-pink-dark hover:text-brand-pink-dark/80 text-sm font-medium px-3 py-2 rounded-lg hover:bg-brand-pink-light/20 transition-colors"
      scroll={true}
    >
      {children}
    </Link>
  );
}
