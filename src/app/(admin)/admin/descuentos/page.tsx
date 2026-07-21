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

      <div className="bg-brand-pink-light/30 border border-brand-pink/20 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-brand-pink-dark mb-2">
          🏷️ ¿Cómo funcionan los descuentos?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-600">
          <div>
            <p className="font-semibold text-neutral-700 mb-1">Alcance</p>
            <p>• <strong>Toda la tienda:</strong> aplica a todos los productos.</p>
            <p>• <strong>Por categoría:</strong> solo esa categoría.</p>
            <p>• <strong>Por producto:</strong> solo ese artículo.</p>
          </div>
          <div>
            <p className="font-semibold text-neutral-700 mb-1">Audiencia</p>
            <p>• <strong>Todos:</strong> cualquier visitante.</p>
            <p>• <strong>Mayoristas:</strong> solo cuentas mayoristas aprobadas.</p>
            <p>• <strong>Distribuidores:</strong> solo cuentas distribuidoras.</p>
          </div>
          <div>
            <p className="font-semibold text-neutral-700 mb-1">Vigencia</p>
            <p>Puedes definir fecha de inicio y fin. Sin fechas = siempre activo.</p>
          </div>
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
