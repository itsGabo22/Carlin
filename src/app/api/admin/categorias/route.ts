import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

/** '' → null, para no guardar strings vacíos en columnas opcionales. */
const emptyToNull = (v: unknown): string | null => {
  if (typeof v !== 'string') return v == null ? null : String(v);
  const t = v.trim();
  return t === '' ? null : t;
};

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true, children: true }
        }
      },
      // Mismo criterio que el catálogo público: orden manual y luego alfabético.
      orderBy: [{ order: 'asc' }, { name: 'asc' }]
    });
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('[ADMIN CATEGORIAS GET ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, description, imageUrl, parentId, groupByBrand, active, order } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
    }

    const finalSlug = emptyToNull(slug) || slugify(String(name), { lower: true, strict: true });

    const category = await prisma.category.create({
      data: {
        name: String(name).trim(),
        slug: finalSlug,
        description: emptyToNull(description),
        imageUrl: emptyToNull(imageUrl),
        parentId: emptyToNull(parentId),
        groupByBrand: groupByBrand === true,
        active: active !== false,
        order: Number.isFinite(Number(order)) ? Math.trunc(Number(order)) : 0,
      }
    });

    // Dentro del try/catch a propósito.
    revalidatePath('/');
    revalidatePath('/catalogo', 'layout');
    revalidatePath('/admin/categorias');

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('[ADMIN CATEGORIAS POST ERROR]', error);
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe una categoría con ese nombre o slug.' }, { status: 409 });
    }
    if (error?.code === 'P2003') {
      return NextResponse.json({ error: 'La categoría padre seleccionada no existe.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
