import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from '@/proxy';
import { normalizeProductInput, productErrorResponse } from '@/lib/api/productos';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Faltaba este handler: el formulario de edición hace
 * `fetch('/api/admin/productos/[id]')` al montar. Sin GET exportado, Next
 * respondía 405 con body vacío → el `.json()` del cliente reventaba con
 * "Unexpected end of JSON input" y el formulario quedaba en blanco. Al guardar,
 * ese formulario vacío mandaba categoryId: '' y el PATCH devolvía 500 por
 * violación de foreign key.
 */
export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: { tags: { select: { tagId: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
    }

    // Los Decimal de Prisma se serializan como string; el formulario necesita
    // números para los <input type="number">.
    return NextResponse.json({
      ...product,
      retailPrice: Number(product.retailPrice),
      wholesalePrice: Number(product.wholesalePrice),
      distributorPrice: Number(product.distributorPrice),
      comparePrice: product.comparePrice === null ? 0 : Number(product.comparePrice),
      description: product.description ?? '',
      sku: product.sku ?? '',
      unit: product.unit ?? 'unidad',
      brandId: product.brandId ?? '',
      tags: product.tags.map(t => t.tagId),
    });
  } catch (error) {
    return productErrorResponse(error, '[ADMIN PRODUCTOS GET BY ID ERROR]');
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { isAuthenticated } = await checkAdminAuth(req as any);
    if (!isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'El cuerpo de la petición no es JSON válido.' }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'El producto no existe o fue eliminado.' }, { status: 404 });
    }

    const parsed = normalizeProductInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { tagIds, ...data } = parsed.data;

    // Imágenes opcionales: si el body no trae el campo `imageUrls`, se conservan
    // las del registro existente en vez de borrarlas con un array vacío.
    const imageUrls = 'imageUrls' in body ? data.imageUrls : existing.imageUrls;

    const [, product] = await prisma.$transaction([
      prisma.productTag.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: {
          ...data,
          imageUrls,
          tags: { create: tagIds.map(tagId => ({ tagId })) },
        }
      })
    ]);

    const newlyUsed = imageUrls.filter(url => !existing.imageUrls.includes(url));
    if (newlyUsed.length > 0) {
      await prisma.imageBandeja.updateMany({
        where: { url: { in: newlyUsed } },
        data: { assigned: true },
      });
    }

    // Dentro del try/catch a propósito.
    revalidatePath('/');
    revalidatePath('/catalogo');
    revalidatePath('/admin/productos');
    revalidatePath(`/producto/${product.slug}`);
    if (existing.slug !== product.slug) revalidatePath(`/producto/${existing.slug}`);

    return NextResponse.json(product);
  } catch (error) {
    return productErrorResponse(error, '[ADMIN PRODUCTOS PATCH ERROR]');
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  try {
    const { isAuthenticated } = await checkAdminAuth(req as any);
    if (!isAuthenticated) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const product = await prisma.product.update({
      where: { id },
      data: { active: false }
    });

    revalidatePath('/');
    revalidatePath('/catalogo');
    revalidatePath('/admin/productos');
    revalidatePath(`/producto/${product.slug}`);

    return NextResponse.json(product);
  } catch (error) {
    return productErrorResponse(error, '[ADMIN PRODUCTOS DELETE ERROR]');
  }
}
