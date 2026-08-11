'use client';

import { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { formatCOP } from '@/lib/utils/carlin-pricing';

/**
 * Filtro por precio. Igual que la referencia, funciona por query params
 * (`min`/`max`) resueltos en el servidor — no filtra en cliente.
 *
 * Dos deslizadores sobre el rango real de precios de la categoría, más un
 * botón que aplica. Al aplicar se reinicia la paginación a la página 1.
 */
export function PriceFilter({
  min,
  max,
  currentMin,
  currentMax,
}: {
  min: number;
  max: number;
  currentMin: number;
  currentMax: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [desde, setDesde] = useState(currentMin);
  const [hasta, setHasta] = useState(currentMax);

  const rangoInvalido = min >= max;
  const hayFiltro = searchParams.has('min') || searchParams.has('max');

  const aplicar = () => {
    const params = new URLSearchParams(searchParams.toString());
    // Si el rango cubre todo, se quitan los parámetros en vez de ensuciar la URL.
    if (desde <= min && hasta >= max) {
      params.delete('min');
      params.delete('max');
    } else {
      params.set('min', String(Math.min(desde, hasta)));
      params.set('max', String(Math.max(desde, hasta)));
    }
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const limpiar = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('min');
    params.delete('max');
    params.delete('page');
    setDesde(min);
    setHasta(max);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  if (rangoInvalido) return null;

  return (
    <div>
      <h3 className="mb-3 font-serif text-base font-bold text-brand-pink-dark">Filtrar por precio</h3>

      <div className="space-y-3">
        <label className="block">
          <span className="text-xs text-brand-text">Desde</span>
          <input
            type="range"
            min={min}
            max={max}
            step={1000}
            value={desde}
            onChange={(e) => setDesde(Math.min(Number(e.target.value), hasta))}
            className="mt-1 w-full accent-[var(--color-brand-pink)]"
            aria-label="Precio mínimo"
          />
        </label>

        <label className="block">
          <span className="text-xs text-brand-text">Hasta</span>
          <input
            type="range"
            min={min}
            max={max}
            step={1000}
            value={hasta}
            onChange={(e) => setHasta(Math.max(Number(e.target.value), desde))}
            className="mt-1 w-full accent-[var(--color-brand-pink)]"
            aria-label="Precio máximo"
          />
        </label>

        <p className="text-sm font-medium text-brand-neutral-dark">
          {formatCOP(desde)} — {formatCOP(hasta)}
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={aplicar}
            className="flex-1 rounded-xl bg-brand-pink px-3 py-2 text-xs font-bold uppercase tracking-[1px] text-white transition-colors hover:bg-brand-pink-dark"
          >
            Filtrar
          </button>
          {hayFiltro && (
            <button
              type="button"
              onClick={limpiar}
              className="rounded-xl border border-brand-cream px-3 py-2 text-xs font-semibold text-brand-text transition-colors hover:bg-brand-cream/40"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
