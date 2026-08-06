import { prisma } from '@/lib/prisma';
import { CategoriasClient } from './CategoriasClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminCategoriasPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true, children: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return <CategoriasClient categories={categories} />;
}
