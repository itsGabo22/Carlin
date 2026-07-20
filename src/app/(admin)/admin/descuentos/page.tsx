import { prisma } from '@/lib/prisma';
import { DescuentosClient } from './DescuentosClient';
import { Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDescuentosPage() {
  const discounts = await prisma.discount.findMany({
    include: {
      product: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  const products = await prisma.product.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-nunito text-gray-900 flex items-center gap-2">
            <Tag className="text-brand-pink" /> Descuentos
          </h1>
          <p className="text-gray-500">Reglas de descuento y cupones.</p>
        </div>
      </div>
      <DescuentosClient 
        initialDiscounts={discounts} 
        products={products} 
        categories={categories} 
      />
    </div>
  );
}
