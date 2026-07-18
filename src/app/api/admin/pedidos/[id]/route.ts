import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionResult } from '@/lib/auth/carlin-session';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Auth Check
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action as 'confirm' | 'reject';

    if (action !== 'confirm' && action !== 'reject') {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    }

    // Fetch order with items
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.status !== 'PENDING_WHATSAPP') {
      return NextResponse.json({ error: 'El pedido ya fue procesado' }, { status: 400 });
    }

    if (action === 'reject') {
      const updated = await prisma.order.update({
        where: { id },
        data: { status: 'REJECTED' }
      });
      return NextResponse.json(updated);
    }

    // If confirm, verify stock for all items BEFORE updating anything
    for (const item of order.items) {
      if (item.product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Stock insuficiente para "${item.name}". Disponible: ${item.product.stock}` 
        }, { status: 409 });
      }
    }

    // Atomic transaction to update stock and order status
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Decrement stock for each product
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // 2. Update order status
      const confirmedOrder = await tx.order.update({
        where: { id },
        data: { status: 'CONFIRMED' }
      });

      return confirmedOrder;
    });

    return NextResponse.json(transaction);
    
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json({ error: 'Error interno al procesar el pedido' }, { status: 500 });
  }
}
