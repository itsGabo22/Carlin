import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { productRepository, brandRepository } from '@/lib/repositories';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { SubcategoryCircles } from '@/components/catalog/SubcategoryCircles';
import { CategoryTree, type TreeNode } from '@/components/catalog/CategoryTree';
import { PriceFilter } from '@/components/catalog/PriceFilter';
import { BrandFilter } from '@/components/catalog/BrandFilter';
import { ResultsHeader } from '@/components/catalog/ResultsHeader';
import { parseSort, PAGE_SIZE_DESKTOP, PAGE_SIZE_MOBILE, type SortValue } from '@/lib/catalog/sort';
import { ResponsivePageSize } from '@/components/catalog/ResponsivePageSize';
import {
  resolveCategoryChain,
  getActiveCategories,
  indexById,
  childrenOf,
  buildCategoryHref,
  type CategoryNode,
} from '@/lib/catalog/categoryPath';

type PageParams = { params: Promise<{ path?: string[] }> };
type SearchParams = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

const primerValor = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { path } = await params;
  if (!path || path.length === 0) {
    return {
      title: 'Catálogo',
      description: 'Explora todos nuestros productos con tus precios especiales.',
    };
  }

  const cadena = await resolveCategoryChain(path);
  if (!cadena) return { title: 'Categoría no encontrada' };

  const actual = cadena[cadena.length - 1];
  return {
    title: actual.name,
    description: actual.description ?? `Explora ${actual.name} en el catálogo de Carlin Cosméticos.`,
  };
}

/** Recoge la categoría y TODAS sus descendientes, a cualquier profundidad. */
function descendientes(todas: CategoryNode[], raizId: string): string[] {
  const ids = [raizId];
  for (let i = 0; i < ids.length; i++) {
    for (const c of todas) {
      if (c.parentId === ids[i]) ids.push(c.id);
    }
  }
  return ids;
}

/** Arma el árbol para el sidebar con enlaces de profundidad completa. */
function construirArbol(todas: CategoryNode[], porId: Map<string, CategoryNode>, parentId: string | null): TreeNode[] {
  return childrenOf(todas, parentId).map((c) => ({
    id: c.id,
    name: c.name,
    href: buildCategoryHref(c, porId),
    children: construirArbol(todas, porId, c.id),
  }));
}

export default async function CatalogoPage({ params, searchParams }: PageParams & SearchParams) {
  const { path } = await params;
  const sp = await searchParams;

  const hasPath = Array.isArray(path) && path.length > 0;

  // ── Resolución de la ruta ──────────────────────────────
  let cadena: CategoryNode[] | null = null;
  if (hasPath) {
    cadena = await resolveCategoryChain(path);
    if (!cadena) notFound();
  } else {
    cadena = [];
  }

  const actual = cadena.length > 0 ? cadena[cadena.length - 1] : null;

  const [todas, marcas] = await Promise.all([
    getActiveCategories(),
    brandRepository.getAll(),
  ]);
  const porId = indexById(todas);

  // ── Parámetros de listado ───────────────────────────────────────
  const page = Math.max(1, Number(primerValor(sp.page)) || 1);
  const perParam = Number(primerValor(sp.per));
  const pageSize = perParam === PAGE_SIZE_MOBILE ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;

  const sort: SortValue = parseSort(primerValor(sp.orden));
  const brandSlug = primerValor(sp.marca ?? sp.brand);

  const idsCategoria = actual ? descendientes(todas, actual.id) : undefined;

  // Rango de precios real de la categoría/marca, para acotar el filtro.
  const whereRango: any = { active: true };
  if (idsCategoria) {
    whereRango.categoryId = { in: idsCategoria };
  }
  if (brandSlug) {
    whereRango.brand = { slug: brandSlug };
  }

  const rango = await prisma.product.aggregate({
    where: whereRango,
    _min: { retailPrice: true },
    _max: { retailPrice: true },
  });
  const precioMin = Math.floor(Number(rango._min.retailPrice ?? 0));
  const precioMax = Math.ceil(Number(rango._max.retailPrice ?? 0));

  const minParam = Number(primerValor(sp.min));
  const maxParam = Number(primerValor(sp.max));
  const filtroMin = Number.isFinite(minParam) && primerValor(sp.min) !== undefined ? minParam : undefined;
  const filtroMax = Number.isFinite(maxParam) && primerValor(sp.max) !== undefined ? maxParam : undefined;

  const [config, result] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: 'singleton' } }),
    productRepository.getAll({
      categoryIds: idsCategoria,
      brandSlug,
      page,
      pageSize,
      sort,
      minPrice: filtroMin,
      maxPrice: filtroMax,
    }),
  ]);

  const safeConfig = config || ({ inactivityDays: 30 } as any);
  const sessionResult = await getSessionResult(safeConfig);

  // ── Datos de presentación ───────────────────────────────────────
  const subcategorias = childrenOf(todas, actual ? actual.id : null).map((c) => ({
    id: c.id,
    name: c.name,
    href: buildCategoryHref(c, porId),
    imageUrl: c.imageUrl,
  }));

  const arbol = construirArbol(todas, porId, null);
  const idsActivos = cadena.map((c) => c.id);

  const migas = cadena.map((c) => ({ name: c.name, href: buildCategoryHref(c, porId) }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {/* Sincroniza `per` con el ancho de pantalla (24 escritorio / 12 móvil) */}
      <ResponsivePageSize />

      {/* Migas de pan */}
      <nav aria-label="Ruta de navegación" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-brand-text">
        {actual ? (
          <Link href="/catalogo" className="transition-colors hover:text-brand-pink-dark">Catálogo</Link>
        ) : (
          <span className="font-semibold text-brand-neutral-dark">Catálogo</span>
        )}
        {migas.map((m, i) => (
          <span key={m.href} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-brand-text/40" />
            {i === migas.length - 1 ? (
              <span className="font-semibold text-brand-neutral-dark">{m.name}</span>
            ) : (
              <Link href={m.href} className="transition-colors hover:text-brand-pink-dark">{m.name}</Link>
            )}
          </span>
        ))}
      </nav>

      <header className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-bold text-brand-neutral-dark sm:text-4xl">
          {actual ? actual.name : 'Catálogo'}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-brand-text">
          {actual
            ? (actual.description ?? `Explora ${actual.name} en el catálogo de Carlin Cosméticos.`)
            : 'Explora todos nuestros productos con tus precios especiales.'}
        </p>
      </header>

      <SubcategoryCircles items={subcategorias} />

      <div className="flex flex-col gap-8 md:flex-row">
        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <aside className="w-full shrink-0 md:w-64">
          <details className="group rounded-2xl border border-brand-cream bg-white shadow-sm md:hidden">
            <summary className="cursor-pointer list-none px-5 py-4 font-serif font-bold text-brand-pink-dark">
              Categorías y filtros
              <span className="float-right text-brand-text/50 transition-transform group-open:rotate-90">›</span>
            </summary>
            <div className="space-y-6 px-5 pb-5">
              <div>
                <h2 className="mb-3 font-serif text-base font-bold text-brand-pink-dark">Categorías</h2>
                <CategoryTree nodes={arbol} activeIds={idsActivos} />
              </div>
              <div className="border-t border-brand-cream pt-5">
                <BrandFilter brands={marcas} activeBrandSlug={brandSlug} />
              </div>
              <div className="border-t border-brand-cream pt-5">
                <PriceFilter
                  min={precioMin}
                  max={precioMax}
                  currentMin={filtroMin ?? precioMin}
                  currentMax={filtroMax ?? precioMax}
                />
              </div>
            </div>
          </details>

          <div className="sticky top-24 hidden space-y-6 rounded-2xl border border-brand-cream bg-white p-5 shadow-sm md:block">
            <div>
              <h2 className="mb-3 font-serif text-base font-bold text-brand-pink-dark">Categorías</h2>
              <CategoryTree nodes={arbol} activeIds={idsActivos} />
            </div>
            <div className="border-t border-brand-cream pt-5">
              <BrandFilter brands={marcas} activeBrandSlug={brandSlug} />
            </div>
            <div className="border-t border-brand-cream pt-5">
              <PriceFilter
                min={precioMin}
                max={precioMax}
                currentMin={filtroMin ?? precioMin}
                currentMax={filtroMax ?? precioMax}
              />
            </div>
          </div>
        </aside>

        {/* ── Grilla ──────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1">
          <ResultsHeader total={result.total} page={result.page} pageSize={result.pageSize} sort={sort} />
          <ProductGrid
            products={result.products}
            priceLevel={sessionResult.priceLevel}
            pagination={{
              total: result.total,
              page: result.page,
              pages: result.pages,
              pageSize: result.pageSize,
            }}
          />
        </div>
      </div>
    </div>
  );
}
