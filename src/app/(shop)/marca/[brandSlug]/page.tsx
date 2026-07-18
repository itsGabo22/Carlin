import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { productRepository, brandRepository } from '@/lib/repositories';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import Image from 'next/image';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brandSlug: string }>;
}): Promise<Metadata> {
  const { brandSlug } = await params;
  const brand = await brandRepository.getBySlug(brandSlug);
  return {
    title: brand ? `Productos ${brand.name}` : 'Marca no encontrada',
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ brandSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { brandSlug } = await params;
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;

  const brand = await brandRepository.getBySlug(brandSlug);
  if (!brand) {
    notFound();
  }

  const [config, result] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: 'singleton' } }),
    productRepository.getByBrand(brandSlug, { page, pageSize: 24 })
  ]);

  const safeConfig = config || { inactivityDays: 30 } as any;
  const sessionResult = await getSessionResult(safeConfig);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl p-6 border border-brand-pink-light/20 shadow-sm sticky top-24">
            <h2 className="font-nunito font-bold text-brand-pink-dark text-lg mb-4">{brand.name}</h2>
            {brand.description && <p className="text-sm text-gray-600">{brand.description}</p>}
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-8 flex items-center gap-6">
            {brand.logoUrl && (
              <div className="relative w-20 h-20 rounded-full border border-gray-100 overflow-hidden shrink-0 bg-white shadow-sm">
                <Image src={brand.logoUrl} alt={brand.name} fill className="object-cover" unoptimized />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-nunito font-bold text-gray-900 mb-2">{brand.name}</h1>
              <p className="text-gray-600">Todos los productos de {brand.name}</p>
            </div>
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
