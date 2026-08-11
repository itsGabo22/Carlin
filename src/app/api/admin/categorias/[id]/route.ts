import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

const emptyToNull = (v: unknown): string | null => {
  if (typeof v !== 'string') return v == null ? null : String(v);
  const t = v.trim();
  return t === '' ? null : t;
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, slug, description, imageUrl, parentId, groupByBrand, active, order } = body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'La categoría no existe.' }, { status: 404 });
    }

    const nextParentId = emptyToNull(parentId);

    // Evita que una categoría sea su propio padre.
    if (nextParentId === id) {
      return NextResponse.json({ error: 'Una categoría no puede ser su propio padre' }, { status: 400 });
    }

    // Evita ciclos indirectos (A → B → A) subiendo por la cadena de padres.
    if (nextParentId) {
      let cursor: string | null = nextParentId;
      const vistos = new Set<string>();
      while (cursor) {
        if (cursor === id) {
          return NextResponse.json(
            { error: 'Ese movimiento crearía un ciclo entre categorías.' },
            { status: 400 },
          );
        }
        if (vistos.has(cursor)) break;
        vistos.add(cursor);
        const padre: { parentId: string | null } | null = await prisma.category.findUnique({
          where: { id: cursor },
          select: { parentId: true },
        });
        cursor = padre?.parentId ?? null;
      }
    }

    const finalSlug = emptyToNull(slug)
      || (name ? slugify(String(name), { lower: true, strict: true }) : existing.slug);

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: name ? String(name).trim() : existing.name,
        slug: finalSlug,
        description: 'description' in body ? emptyToNull(description) : existing.description,
        // Si no se envía imageUrl, se conserva la existente (no se borra).
        imageUrl: 'imageUrl' in body ? emptyToNull(imageUrl) : existing.imageUrl,
        parentId: nextParentId,
        groupByBrand: 'groupByBrand' in body ? groupByBrand === true : existing.groupByBrand,
        active: 'active' in body ? active !== false : existing.active,
        order: 'order' in body && Number.isFinite(Number(order))
          ? Math.trunc(Number(order))
          : existing.order,
      }
    });

    revalidatePath('/');
    revalidatePath('/catalogo');
    revalidatePath(`/catalogo/${category.slug}`);
    if (existing.slug !== category.slug) revalidatePath(`/catalogo/${existing.slug}`);
    revalidatePath('/admin/categorias');

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('[ADMIN CATEGORIAS PATCH ERROR]', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre o slug.' }, { status: 409 });
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'La categoría no existe.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const categoria = await prisma.category.findUnique({ where: { id }, select: { slug: true } });
    if (!categoria) {
      return NextResponse.json({ error: 'La categoría no existe.' }, { status: 404 });
    }

    // Se bloquea el borrado si hay productos activos o subcategorías colgando.
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

    await prisma.category.delete({ where: { id } });

    revalidatePath('/');
    revalidatePath('/catalogo');
    revalidatePath(`/catalogo/${categoria.slug}`);
    revalidatePath('/admin/categorias');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN CATEGORIAS DELETE ERROR]', error);
    if (error?.code === 'P2003') {
      return NextResponse.json(
        { error: 'No se puede eliminar: hay productos u otros registros que dependen de esta categoría.' },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
