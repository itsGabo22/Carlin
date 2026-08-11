import { prisma } from '@/lib/prisma';

/**
 * Resolución de rutas de catálogo a profundidad arbitraria.
 *
 * Las categorías viven en un árbol (`Category.parentId`) que hoy llega a 3
 * niveles (Maquillaje > Ojos > Sombras). Antes el catálogo tenía rutas fijas de
 * 2 segmentos, así que /catalogo/maquillaje/sombras daba 404 y solo funcionaba
 * /catalogo/ojos/sombras — tratando a Ojos como si fuera raíz.
 *
 * Ahora la ruta es un catch-all y la cadena se valida entera: cada segmento de
 * la URL tiene que coincidir, en orden, con la cadena real desde una raíz hasta
 * la categoría destino. Una ruta parcial o desordenada devuelve 404 en vez de
 * resolver "por casualidad".
 */

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  active: boolean;
  order: number;
};

const SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  parentId: true,
  active: true,
  order: true,
} as const;

/** Ordena por `order` y desempata alfabéticamente, igual que el resto del sitio. */
export const byOrder = (a: CategoryNode, b: CategoryNode) =>
  a.order - b.order || a.name.localeCompare(b.name, 'es');

/**
 * Devuelve la cadena completa (raíz → … → destino) que corresponde EXACTAMENTE
 * a los segmentos recibidos, o null si no coincide.
 *
 * Reglas:
 *  - el primer segmento tiene que ser una categoría raíz (parentId === null);
 *  - cada segmento siguiente tiene que ser hija directa del anterior;
 *  - todas las categorías de la cadena tienen que estar activas.
 */
export async function resolveCategoryChain(segments: string[]): Promise<CategoryNode[] | null> {
  if (!segments.length) return null;

  // Los slugs son únicos, así que una sola consulta trae todos los candidatos.
  const encontradas = await prisma.category.findMany({
    where: { slug: { in: segments }, active: true },
    select: SELECT,
  });

  // Si algún segmento no existe (o está inactivo), la ruta no es válida.
  if (encontradas.length !== new Set(segments).size) return null;

  const porSlug = new Map(encontradas.map((c) => [c.slug, c]));
  const cadena: CategoryNode[] = [];

  for (let i = 0; i < segments.length; i++) {
    const actual = porSlug.get(segments[i]);
    if (!actual) return null;

    const esperado = i === 0 ? null : cadena[i - 1].id;
    // El primer segmento debe ser raíz; los demás, hijos del anterior.
    if (actual.parentId !== esperado) return null;

    cadena.push(actual);
  }

  return cadena;
}

/**
 * Construye la URL completa de una categoría subiendo por sus padres.
 * Ej: Sombras → /catalogo/maquillaje/ojos/sombras
 *
 * Recibe un mapa id→categoría para no hacer una consulta por nivel cuando se
 * generan muchos enlaces (sidebar, círculos, sitemap).
 */
export function buildCategoryHref(
  category: Pick<CategoryNode, 'id' | 'slug' | 'parentId'>,
  porId: Map<string, Pick<CategoryNode, 'id' | 'slug' | 'parentId'>>,
): string {
  const slugs: string[] = [];
  let cursor: Pick<CategoryNode, 'id' | 'slug' | 'parentId'> | undefined = category;
  const vistos = new Set<string>();

  while (cursor) {
    if (vistos.has(cursor.id)) break; // guarda anti-ciclo
    vistos.add(cursor.id);
    slugs.unshift(cursor.slug);
    cursor = cursor.parentId ? porId.get(cursor.parentId) : undefined;
  }

  return `/catalogo/${slugs.join('/')}`;
}

/** Todas las categorías activas, para armar el árbol lateral y los enlaces. */
export async function getActiveCategories(): Promise<CategoryNode[]> {
  return prisma.category.findMany({
    where: { active: true },
    select: SELECT,
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });
}

/** Índice id→categoría para resolver rutas sin consultas extra. */
export function indexById(categories: CategoryNode[]): Map<string, CategoryNode> {
  return new Map(categories.map((c) => [c.id, c]));
}

/** Hijas directas de una categoría, ya ordenadas. */
export function childrenOf(categories: CategoryNode[], parentId: string | null): CategoryNode[] {
  return categories.filter((c) => c.parentId === parentId).sort(byOrder);
}
