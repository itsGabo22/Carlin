import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const body = await req.json();
    const tagIds: string[] = body.tags || [];

    const [_, product] = await prisma.$transaction([
      prisma.productTag.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: {
          name: body.name,
          slug: body.slug,
          description: body.description,
          retailPrice: body.retailPrice,
          wholesalePrice: body.wholesalePrice,
          distributorPrice: body.distributorPrice,
          comparePrice: body.comparePrice,
          sku: body.sku,
          stock: body.stock,
          unit: body.unit,
          tones: body.tones,
          imageUrls: body.imageUrls,
          featured: body.featured,
          active: body.active,
          categoryId: body.categoryId,
          brandId: body.brandId || null,
          tags: { create: tagIds.map(tagId => ({ tagId })) },
        }
      })
    ]);

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('[ADMIN PRODUCTOS PATCH ERROR]', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;

    const product = await prisma.product.update({
      where: { id },
      data: { active: false }
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('[ADMIN PRODUCTOS DELETE ERROR]', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
