import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { name, slug, description, imageUrl, parentId, groupByBrand } = await req.json();
    const finalSlug = slug || slugify(name, { lower: true, strict: true });

    // Prevent circular parent reference
    if (parentId === id) {
      return NextResponse.json({ error: 'Una categoría no puede ser su propio padre' }, { status: 400 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { name, slug: finalSlug, description, imageUrl, parentId, groupByBrand }
    });

    return NextResponse.json(category);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El slug o nombre ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check for active products and children
    const [activeProducts, childrenCount] = await Promise.all([
      prisma.product.count({ where: { categoryId: id, active: true } }),
      prisma.category.count({ where: { parentId: id } })
    ]);

    if (activeProducts > 0 || childrenCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar porque tiene productos activos o subcategorías.' },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
