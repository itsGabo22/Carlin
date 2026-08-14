import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const discounts = await prisma.discount.findMany({
      include: {
        product: { select: { id: true, name: true } },
        products: { include: { product: { select: { id: true, name: true } } } },
        category: { select: { id: true, name: true } }
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
    const couponCode = body.couponCode && typeof body.couponCode === 'string' && body.couponCode.trim() !== '' ? body.couponCode.trim() : null;
    const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : (body.productId ? [body.productId] : []);

    const discount = await prisma.discount.create({
      data: {
        label: body.label,
        percentage: body.percentage,
        scope: body.scope,
        audience: body.audience || 'ALL',
        couponCode,
        productId: body.scope === 'PRODUCT' && productIds.length > 0 ? productIds[0] : null,
        categoryId: body.scope === 'CATEGORY' ? body.categoryId : null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        active: body.active !== undefined ? body.active : true,
        ...(body.scope === 'PRODUCT' && productIds.length > 0 && {
          products: {
            create: productIds.map((pid: string) => ({ productId: pid }))
          }
        })
      },
      include: {
        product: { select: { id: true, name: true } },
        products: { include: { product: { select: { id: true, name: true } } } },
        category: { select: { id: true, name: true } }
      }
    });
    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error('[ADMIN DESCUENTOS POST ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
