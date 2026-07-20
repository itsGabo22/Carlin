import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [pendingOrders, pendingWholesalers] = await Promise.all([
      prisma.order.count({ where: { status: 'PENDING_WHATSAPP' } }),
      prisma.wholesaleUser.count({ where: { approved: false } }),
    ]);

    const notifications = [];
    
    if (pendingOrders > 0) {
      notifications.push({
        id: 'orders',
        type: 'order',
        message: `${pendingOrders} pedido${pendingOrders > 1 ? 's' : ''} pendiente${pendingOrders > 1 ? 's' : ''} de confirmar`,
        href: '/admin/pedidos',
        count: pendingOrders,
      });
    }

    if (pendingWholesalers > 0) {
      notifications.push({
        id: 'wholesalers',
        type: 'wholesaler',
        message: `${pendingWholesalers} solicitud${pendingWholesalers > 1 ? 'es' : ''} de mayorista por aprobar`,
        href: '/admin/mayoristas',
        count: pendingWholesalers,
      });
    }

    return NextResponse.json({
      notifications,
      total: pendingOrders + pendingWholesalers,
    });
  } catch (error) {
    console.error('[ADMIN NOTIFICACIONES ERROR]', error);
    return NextResponse.json(
      { error: 'Error al cargar notificaciones' },
      { status: 500 }
    );
  }
}
