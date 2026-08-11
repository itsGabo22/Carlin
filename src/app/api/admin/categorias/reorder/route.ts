import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * Reordena categorías dentro de un mismo nivel.
 * Body: { items: [{ id, order }] }
 * Se aplica en una transacción para que el nivel nunca quede a medio reordenar.
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : null;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No se recibió ninguna categoría para reordenar.' }, { status: 400 });
    }

    const limpios: { id: string; order: number }[] = items
      .filter((i: any) => typeof i?.id === 'string' && Number.isFinite(Number(i?.order)))
      .map((i: any) => ({ id: String(i.id), order: Math.trunc(Number(i.order)) }));

    if (limpios.length !== items.length) {
      return NextResponse.json({ error: 'Formato inválido: cada elemento necesita id y order.' }, { status: 400 });
    }

    await prisma.$transaction(
      limpios.map(({ id, order }) =>
        prisma.category.update({ where: { id }, data: { order } })
      )
    );

    revalidatePath('/');
    revalidatePath('/catalogo');
    revalidatePath('/admin/categorias');

    return NextResponse.json({ success: true, actualizadas: limpios.length });
  } catch (error: any) {
    console.error('[ADMIN CATEGORIAS REORDER ERROR]', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Alguna de las categorías ya no existe.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
