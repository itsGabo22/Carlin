'use client';

import { useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { PAGE_SIZE_MOBILE, MOBILE_MAX_WIDTH } from '@/lib/catalog/sort';

/**
 * Ajusta el tamaño de página al ancho de pantalla: 24 en escritorio, 12 en móvil.
 *
 * La paginación se resuelve en el SERVIDOR (skip/take en Prisma), así que el
 * tamaño tiene que llegar como dato al servidor: viaja en el query param `per`.
 * Este componente solo sincroniza ese parámetro con el viewport real.
 *
 * Por qué así y no con CSS: recortar con CSS mostraría 12 pero seguiría
 * trayendo 24 y el contador ("Mostrando 1–24 de N") mentiría. Aquí el conteo,
 * el número de páginas y lo que se consulta son coherentes en ambos anchos.
 *
 * Escritorio es el valor por defecto (sin `per` en la URL), así que ahí no se
 * reescribe nada; solo en móvil se hace un `replace` inicial.
 */
export function ResponsivePageSize() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`);

    const sync = () => {
      const actual = searchParams.get('per');
      const deseado = mq.matches ? String(PAGE_SIZE_MOBILE) : null;

      if (actual === deseado) return;
      // Evita reescribir en escritorio cuando ya no hay parámetro.
      if (deseado === null && actual === null) return;

      const params = new URLSearchParams(searchParams.toString());
      if (deseado === null) params.delete('per');
      else params.set('per', deseado);
      // Cambiar el tamaño de página invalida el número de página actual.
      params.delete('page');

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    };

    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [router, pathname, searchParams]);

  return null;
}
