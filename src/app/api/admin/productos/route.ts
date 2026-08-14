import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from '@/proxy';
import { normalizeProductInput, productErrorResponse } from '@/lib/api/productos';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        tags: { include: { tag: true } },
        variants: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('[ADMIN PRODUCTOS GET ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { isAuthenticated } = await checkAdminAuth(req as any);
    if (!isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'El cuerpo de la petición no es JSON válido.' }, { status: 400 });
    }

    const parsed = normalizeProductInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { tagIds, variants, ...data } = parsed.data;

    const product = await prisma.product.create({
      data: {
        ...data,
        tags: { create: tagIds.map(tagId => ({ tagId })) },
        ...(variants.length > 0 && {
          variants: {
            create: variants.map((v, idx) => ({
              colorName: v.colorName,
              colorHex: v.colorHex,
              imageUrl: v.imageUrl,
              stock: v.stock,
              active: v.active,
              order: v.order ?? idx,
            }))
          }
        })
      }
    });

    if (data.imageUrls.length > 0) {
      await prisma.imageBandeja.updateMany({
        where: { url: { in: data.imageUrls } },
        data: { assigned: true },
      });
    }

    revalidatePath('/');
    revalidatePath('/catalogo');
    revalidatePath('/admin/productos');
    revalidatePath(`/producto/${product.slug}`);

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return productErrorResponse(error, '[ADMIN PRODUCTOS POST ERROR]');
  }
}
