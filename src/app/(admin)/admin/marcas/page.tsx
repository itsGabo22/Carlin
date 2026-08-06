import { prisma } from '@/lib/prisma';
import { MarcasClient } from './MarcasClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminMarcasPage() {
  const brands = await prisma.brand.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return <MarcasClient brands={brands} />;
}
