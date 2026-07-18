import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { productRepository, categoryRepository } from '@/lib/repositories';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subcategoria: string }>;
}): Promise<Metadata> {
  const { subcategoria } = await params;
  const category = await categoryRepository.getBySlug(subcategoria);
  return {
    title: category ? category.name : 'Categoría no encontrada',
  };
}

export default async function SubcategoriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ categoria: string; subcategoria: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { categoria, subcategoria } = await params;
  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page, 10) : 1;

  const parentCategory = await categoryRepository.getBySlug(categoria);
  const category = await categoryRepository.getBySlug(subcategoria);
  
  if (!category || category.parent?.slug !== categoria) {
    notFound();
  }

  const [config, result] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: 'singleton' } }),
    productRepository.getAll({ categorySlug: subcategoria, page, pageSize: 24 })
  ]);

  const safeConfig = config || { inactivityDays: 30 } as any;
  const sessionResult = await getSessionResult(safeConfig);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl p-6 border border-brand-pink-light/20 shadow-sm sticky top-24">
            <Link href={`/catalogo/${categoria}`} className="text-xs text-gray-400 hover:text-brand-pink block mb-2">
              &larr; Volver a {parentCategory?.name}
            </Link>
            <h2 className="font-nunito font-bold text-brand-pink-dark text-lg mb-4">{category.name}</h2>
          </div>
        </aside>

        <div className="flex-1">
          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
              <Link href="/catalogo" className="hover:text-brand-pink">Catálogo</Link>
              <span>/</span>
              <Link href={`/catalogo/${categoria}`} className="hover:text-brand-pink">{parentCategory?.name}</Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">{category.name}</span>
            </div>
            <h1 className="text-3xl font-nunito font-bold text-gray-900 mb-2">{category.name}</h1>
            {category.description && <p className="text-gray-600">{category.description}</p>}
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
