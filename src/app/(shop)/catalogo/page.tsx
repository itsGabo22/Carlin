import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { productRepository } from '@/lib/repositories';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { ProductGrid } from '@/components/catalog/ProductGrid';

export const metadata: Metadata = {
  title: 'Catálogo',
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : undefined;

  const [config, result] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: 'singleton' } }),
    productRepository.getAll({ page, pageSize: 24, search: q })
  ]);

  const safeConfig = config || { inactivityDays: 30 } as any;
  const sessionResult = await getSessionResult(safeConfig);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar placeholder para filtros - Hito 1 simple */}
        <aside className="w-full md:w-64 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl p-6 border border-brand-pink-light/20 shadow-sm sticky top-24">
            <h2 className="font-nunito font-bold text-brand-pink-dark text-lg mb-4">Filtros</h2>
            <p className="text-sm text-gray-500">Próximamente filtros por categoría, marca y precio.</p>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-8">
            <h1 className="text-3xl font-nunito font-bold text-gray-900 mb-2">Catálogo</h1>
            <p className="text-gray-600">Explora todos nuestros productos con tus precios especiales.</p>
          </div>

          <ProductGrid
            products={result.products}
            priceLevel={sessionResult.priceLevel}
            pagination={{
              total: result.total,
              page: result.page,
              pages: result.pages,
              pageSize: result.pageSize
            }}
          />
        </div>
      </div>
    </div>
  );
}
