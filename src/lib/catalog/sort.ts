/**
 * Opciones de orden del catálogo.
 *
 * Vive en un módulo NEUTRO (sin 'use client') a propósito: lo consumen tanto el
 * Server Component de la página como el <select> del cliente. Si se exportara
 * desde un módulo 'use client', el servidor recibiría una referencia de cliente
 * en vez del array real y cualquier `SORT_OPTIONS.some(...)` reventaría.
 */
export const SORT_OPTIONS = [
  { value: 'default', label: 'Orden predeterminado' },
  { value: 'latest', label: 'Ordenar por los últimos' },
  { value: 'price-asc', label: 'Ordenar por precio: bajo a alto' },
  { value: 'price-desc', label: 'Ordenar por precio: alto a bajo' },
  { value: 'name-asc', label: 'Ordenar por nombre: A-Z' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

/** Normaliza el query param `orden` a un valor válido. */
export function parseSort(value: string | undefined): SortValue {
  return SORT_OPTIONS.some((o) => o.value === value) ? (value as SortValue) : 'default';
}

/**
 * Tamaños de página del catálogo. También viven aquí (módulo neutro) porque los
 * lee el Server Component: exportarlos desde el componente 'use client' daría
 * una referencia de cliente y la comparación `per === PAGE_SIZE_MOBILE` sería
 * siempre falsa, dejando 24 en móvil sin que nada fallara a la vista.
 */
export const PAGE_SIZE_DESKTOP = 24;
export const PAGE_SIZE_MOBILE = 12;
/** Debajo de este ancho se pagina de a 12 (breakpoint `md` de Tailwind). */
export const MOBILE_MAX_WIDTH = 767;
