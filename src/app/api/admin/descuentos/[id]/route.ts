import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const couponCode = body.couponCode && typeof body.couponCode === 'string' && body.couponCode.trim() !== '' ? body.couponCode.trim() : null;
    const productIds: string[] = Array.isArray(body.productIds) ? body.productIds : (body.productId ? [body.productId] : []);

    // Clean up existing DiscountProduct join entries for this discount
    await prisma.discountProduct.deleteMany({ where: { discountId: id } });

    const discount = await prisma.discount.update({
      where: { id },
      data: {
        label: body.label,
        percentage: body.percentage,
        scope: body.scope,
        audience: body.audience,
        couponCode,
        productId: body.scope === 'PRODUCT' && productIds.length > 0 ? productIds[0] : null,
        categoryId: body.scope === 'CATEGORY' ? body.categoryId : null,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
        active: body.active,
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
    return NextResponse.json(discount);
  } catch (error) {
    console.error('[ADMIN DESCUENTOS PATCH ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.discountProduct.deleteMany({ where: { discountId: id } });
    await prisma.discount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[ADMIN DESCUENTOS DELETE ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
