import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from '@/proxy';

/** Error de negocio dentro de la transacción: aborta el rollback con un status HTTP. */
class ConfirmError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ConfirmError';
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Auth Check — verificación real de admin contra Supabase.
    // Antes esto miraba una cookie `admin_session` que NINGUNA parte del
    // proyecto llega a escribir (el login guarda las cookies de Supabase),
    // así que este endpoint respondía 401 siempre y el stock nunca bajaba.
    const { isAuthenticated } = await checkAdminAuth(request);
    if (!isAuthenticated) {
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
      // Guarda en el WHERE por la misma razón que en el confirm: sin ella, un
      // reject concurrente podía sobreescribir un CONFIRMED que ya había
      // descontado stock, dejando el pedido rechazado y el stock consumido.
      const rejected = await prisma.$executeRaw`
        UPDATE "Order"
           SET status = 'REJECTED', "updatedAt" = now()
         WHERE id = ${id} AND status = 'PENDING_WHATSAPP'`;
      if (rejected === 0) {
        return NextResponse.json({ error: 'El pedido ya fue procesado' }, { status: 400 });
      }
      return NextResponse.json(await prisma.order.findUniqueOrThrow({ where: { id } }));
    }

    // Chequeo previo SÓLO para dar un mensaje de error bonito en el caso normal.
    // NO es la garantía real: entre este SELECT y el UPDATE puede colarse otro
    // confirm. La garantía está en los UPDATE ... WHERE stock >= n de más abajo.
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

    // ── Confirmación atómica ──────────────────────────────────────────────
    // Todo ocurre en UNA transacción y cada escritura lleva su propia guarda
    // en el WHERE, así que dos confirms simultáneos no pueden pasar los dos:
    //
    //   1. Se "reclama" el pedido con `WHERE status = 'PENDING_WHATSAPP'`.
    //      Sólo una petición consigue filas afectadas = 1; las demás ven 0 y
    //      salen con 400. Esto evita que un mismo pedido descuente dos veces.
    //   2. Cada línea descuenta con `WHERE stock >= quantity`. Si otra
    //      transacción se llevó las últimas unidades, filas afectadas = 0 y
    //      lanzamos → rollback: ni se descuenta stock ni queda CONFIRMED.
    let transaction;
    try {
      transaction = await prisma.$transaction(async (tx) => {
        // 1. Reclamar el pedido (idempotencia frente a doble clic / doble request)
        const claimed = await tx.$executeRaw`
          UPDATE "Order"
             SET status = 'CONFIRMED', "updatedAt" = now()
           WHERE id = ${id} AND status = 'PENDING_WHATSAPP'`;
        if (claimed === 0) throw new ConfirmError(400, 'El pedido ya fue procesado');

        // 2. Reservar stock de cada línea, con guarda en el WHERE
        for (const item of order.items) {
          const affected = item.variantId && item.variant
            ? await tx.$executeRaw`
                UPDATE "ProductVariant"
                   SET stock = stock - ${item.quantity}, "updatedAt" = now()
                 WHERE id = ${item.variantId} AND stock >= ${item.quantity}`
            : await tx.$executeRaw`
                UPDATE "Product"
                   SET stock = stock - ${item.quantity}, "updatedAt" = now()
                 WHERE id = ${item.productId} AND stock >= ${item.quantity}`;

          if (affected === 0) {
            const label = item.variantId && item.variant
              ? `la variante "${item.variant.colorName}" de "${item.product.name}"`
              : `"${item.name}"`;
            throw new ConfirmError(409, `Stock insuficiente para ${label}. Otro pedido se llevó las últimas unidades.`);
          }
        }

        return tx.order.findUniqueOrThrow({ where: { id } });
      });
    } catch (err) {
      if (err instanceof ConfirmError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      // P2028 = no se pudo abrir la transacción a tiempo (pool saturado por
      // confirmaciones simultáneas). No se escribió nada, así que es seguro
      // reintentar; devolvemos 503 en lugar de un 500 genérico para que el
      // admin sepa que el pedido sigue pendiente y puede volver a intentarlo.
      if ((err as { code?: string })?.code === 'P2028') {
        return NextResponse.json(
          { error: 'El servidor está ocupado. El pedido sigue pendiente: inténtalo de nuevo.' },
          { status: 503 }
        );
      }
      throw err;
    }

    return NextResponse.json(transaction);
    
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json({ error: 'Error interno al procesar el pedido' }, { status: 500 });
  }
}
