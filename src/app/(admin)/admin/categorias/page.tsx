import { prisma } from '@/lib/prisma';
import { CategoriasClient } from './CategoriasClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCategoriasPage() {
  // El admin ve TODAS las categorías (activas e inactivas); el filtro por
  // `active` es solo para el catálogo público.
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true, children: true }
      }
    },
    orderBy: [{ order: 'asc' }, { name: 'asc' }]
  });

  return <CategoriasClient categories={categories} />;
}
