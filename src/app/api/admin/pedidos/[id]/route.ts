import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    // Fetch order with items, product, and variant relations
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          }
        }
      }
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
      if (item.variantId && item.variant) {
        if (item.variant.stock < item.quantity) {
          return NextResponse.json({ 
            error: `Stock insuficiente para la variante "${item.variant.colorName}" de "${item.product.name}". Disponible: ${item.variant.stock}` 
          }, { status: 409 });
        }
      } else {
        if (item.product.stock < item.quantity) {
          return NextResponse.json({ 
            error: `Stock insuficiente para "${item.name}". Disponible: ${item.product.stock}` 
          }, { status: 409 });
        }
      }
    }

    // Atomic transaction to update stock on specific ProductVariant (or Product) and order status
    const transaction = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.variantId && item.variant) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } }
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }

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
