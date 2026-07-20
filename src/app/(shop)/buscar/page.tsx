import React from 'react';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { productRepository } from '@/lib/repositories';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Search } from 'lucide-react';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';
  return {
    title: q ? `"${q}" — Buscar | CARLIN` : 'Buscar | CARLIN',
  };
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;
  const q = typeof resolvedParams.q === 'string' ? resolvedParams.q : '';

  if (!q) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="bg-brand-pink-light/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-brand-pink-dark/50" />
        </div>
        <h1 className="text-3xl font-nunito font-bold text-gray-900 mb-2">Búsqueda</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Escribe algo en la barra superior para buscar productos.
        </p>
      </div>
    );
  }

  const [config, result] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: 'singleton' } }),
    productRepository.search(q, { page, pageSize: 24 })
  ]);

  const safeConfig = config || { inactivityDays: 30 } as any;
  const sessionResult = await getSessionResult(safeConfig);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-nunito font-bold text-gray-900 mb-2">
          Resultados para "{q}"
        </h1>
        <p className="text-gray-600">
          Encontramos {result.total} {result.total === 1 ? 'producto' : 'productos'}.
        </p>
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
  );
}
