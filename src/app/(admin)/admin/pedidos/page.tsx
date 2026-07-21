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

      <div className="bg-brand-pink-light/30 border border-brand-pink/20 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-brand-pink-dark mb-2">
          📋 Flujo de pedidos
        </p>
        <div className="flex items-start gap-2 text-xs text-neutral-600">
          <div className="flex flex-col gap-1 w-full">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold flex-shrink-0">1</span>
              <span>El cliente genera el pedido desde el carrito → abre WhatsApp con el resumen.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">2</span>
              <span>El pedido aparece aquí como <strong>Pendiente</strong>. Coordina el pago con el cliente por WhatsApp.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold flex-shrink-0">3</span>
              <span>Al confirmar el pedido, el stock se descuenta automáticamente.</span>
            </div>
          </div>
        </div>
      </div>

      <PedidosClient initialOrders={pedidos as any} />
    </div>
  );
}
