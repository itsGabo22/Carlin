'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Brand } from '@/types';

export interface BrandFilterProps {
  brands: Brand[];
  activeBrandSlug?: string;
}

export function BrandFilter({ brands, activeBrandSlug }: BrandFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const seleccionarMarca = (slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!slug || slug === activeBrandSlug) {
      params.delete('marca');
      params.delete('brand');
    } else {
      params.set('marca', slug);
      params.delete('brand');
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (!brands || brands.length === 0) return null;

  return (
    <div>
      <h3 className="mb-3 font-serif text-base font-bold text-brand-pink-dark">Filtrar por marca</h3>
      <ul className="max-h-56 space-y-1 overflow-y-auto pr-1 text-sm text-brand-text">
        <li>
          <button
            type="button"
            onClick={() => seleccionarMarca(null)}
            className={cn(
              'w-full rounded px-2 py-1.5 text-left transition-colors',
              !activeBrandSlug
                ? 'font-bold text-brand-pink-dark bg-brand-pink-light/20'
                : 'hover:bg-brand-cream/40 hover:text-brand-pink-dark'
            )}
          >
            Todas las marcas
          </button>
        </li>
        {brands.map((brand) => {
          const esActiva = activeBrandSlug === brand.slug;
          return (
            <li key={brand.id}>
              <button
                type="button"
                onClick={() => seleccionarMarca(brand.slug)}
                className={cn(
                  'w-full rounded px-2 py-1.5 text-left transition-colors flex items-center justify-between',
                  esActiva
                    ? 'font-bold text-brand-pink-dark bg-brand-pink-light/20'
                    : 'hover:bg-brand-cream/40 hover:text-brand-pink-dark'
                )}
              >
                <span>{brand.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
