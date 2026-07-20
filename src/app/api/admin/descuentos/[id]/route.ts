import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const body = await req.json();
    const discount = await prisma.discount.update({
      where: { id },
      data: {
        label: body.label,
        percentage: body.percentage,
        scope: body.scope,
        audience: body.audience,
        productId: body.productId || null,
        categoryId: body.categoryId || null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        active: body.active,
      }
    });
    return NextResponse.json(discount);
  } catch (error) {
    console.error('[ADMIN DESCUENTOS PATCH ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    await prisma.discount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN DESCUENTOS DELETE ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
