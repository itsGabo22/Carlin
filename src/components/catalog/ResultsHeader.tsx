'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SORT_OPTIONS, type SortValue } from '@/lib/catalog/sort';

/**
 * Línea de resultados: "Mostrando X–Y de Z resultados" + selector de orden.
 * El orden viaja como query param `orden` y lo resuelve el servidor.
 */
export function ResultsHeader({
  total,
  page,
  pageSize,
  sort,
}: {
  total: number;
  page: number;
  pageSize: number;
  sort: SortValue;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const desde = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);

  const cambiarOrden = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'default') params.delete('orden');
    else params.set('orden', value);
    params.delete('page'); // cambiar el orden vuelve a la página 1
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mb-6 flex flex-col gap-3 border-b border-brand-cream pb-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-brand-text">
        {total === 0 ? (
          'No hay productos que coincidan'
        ) : (
          <>
            Mostrando <span className="font-semibold text-brand-neutral-dark">{desde}–{hasta}</span>{' '}
            de <span className="font-semibold text-brand-neutral-dark">{total}</span>{' '}
            {total === 1 ? 'resultado' : 'resultados'}
          </>
        )}
      </p>

      <label className="flex items-center gap-2">
        <span className="sr-only">Ordenar productos</span>
        <select
          value={sort}
          onChange={(e) => cambiarOrden(e.target.value)}
          className="h-10 rounded-xl border border-brand-cream bg-white px-3 text-sm text-brand-neutral-dark outline-none transition-colors focus:border-brand-pink"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
