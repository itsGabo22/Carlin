import { prisma } from '@/lib/prisma';
import type { Category } from '@/types';

export interface ICategoryRepository {
  getAll(): Promise<Category[]>;
  getBySlug(slug: string): Promise<Category | null>;
  getChildren(parentSlug: string): Promise<Category[]>;
  getTree(): Promise<Category[]>;
}

/**
 * Repositorio de categorías para el CATÁLOGO PÚBLICO.
 *
 * Todas las consultas filtran `active: true`. El RLS de Supabase también lo
 * hace, pero no cubre estas llamadas: Prisma entra por conexión directa a
 * Postgres y RLS no se le aplica. Sin este filtro el interruptor "Visible en la
 * tienda" del admin no ocultaría nada en el sitio.
 *
 * El admin NO usa este repositorio: consulta prisma.category directamente para
 * poder ver también las inactivas.
 */
const soloActivas = { active: true } as const;
const ordenPublico = [{ order: 'asc' as const }, { name: 'asc' as const }];

class PrismaCategoryRepository implements ICategoryRepository {
  async getAll(): Promise<Category[]> {
    return prisma.category.findMany({
      where: soloActivas,
      include: { children: { where: soloActivas, orderBy: ordenPublico } },
      orderBy: ordenPublico,
    });
  }

  async getBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findFirst({
      where: { slug, ...soloActivas },
      include: {
        children: { where: soloActivas, orderBy: ordenPublico },
        parent: true,
      },
    });
  }

  async getChildren(parentSlug: string): Promise<Category[]> {
    return prisma.category.findMany({
      where: { parent: { slug: parentSlug }, ...soloActivas },
      orderBy: ordenPublico,
    });
  }

  async getTree(): Promise<Category[]> {
    return prisma.category.findMany({
      where: { parentId: null, ...soloActivas },
      include: { children: { where: soloActivas, orderBy: ordenPublico } },
      orderBy: ordenPublico,
    });
  }
}

export const categoryRepository: ICategoryRepository = new PrismaCategoryRepository();
