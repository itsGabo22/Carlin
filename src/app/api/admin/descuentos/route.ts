import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const discounts = await prisma.discount.findMany({
      include: {
        product: { select: { name: true } },
        category: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(discounts);
  } catch (error) {
    console.error('[ADMIN DESCUENTOS GET ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const discount = await prisma.discount.create({
      data: {
        label: body.label,
        percentage: body.percentage,
        scope: body.scope,
        audience: body.audience || 'ALL',
        productId: body.productId || null,
        categoryId: body.categoryId || null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        active: body.active !== undefined ? body.active : true,
      }
    });
    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error('[ADMIN DESCUENTOS POST ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
