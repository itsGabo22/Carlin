import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { name, slug, description, logoUrl } = await req.json();
    const finalSlug = slug || slugify(name, { lower: true, strict: true });

    const brand = await prisma.brand.update({
      where: { id },
      data: { name, slug: finalSlug, description, logoUrl }
    });

    return NextResponse.json(brand);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El slug o nombre ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check for active products
    const activeProducts = await prisma.product.count({
      where: { brandId: id, active: true }
    });

    if (activeProducts > 0) {
      return NextResponse.json(
        { error: 'Reasigna o elimina los productos de esta marca primero.' },
        { status: 400 }
      );
    }

    await prisma.brand.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN MARCAS DELETE ERROR]', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}

