import { prisma } from '@/lib/prisma';
import { ShoppingBag } from 'lucide-react';
import PedidosClient from './PedidosClient';

export const dynamic = 'force-dynamic';

export default async function AdminPedidosPage() {
  const pedidos = await prisma.order.findMany({
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-nunito text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-brand-pink" /> Pedidos
          </h1>
          <p className="text-gray-500">Gestiona y procesa los pedidos generados por WhatsApp.</p>
        </div>
      </div>

      <PedidosClient initialOrders={pedidos as any} />
    </div>
  );
}
