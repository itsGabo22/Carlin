import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { checkAdminAuth } from '@/proxy';
import { normalizeProductInput, productErrorResponse } from '@/lib/api/productos';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        tags: { select: { tagId: true } },
        variants: { orderBy: { order: 'asc' } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Producto no encontrado.' }, { status: 404 });
    }

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
      variants: product.variants || [],
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

    // Quick partial update (e.g. quick toggle active from list badge)
    if (typeof body.active === 'boolean' && Object.keys(body).length === 1) {
      const product = await prisma.product.update({
        where: { id },
        data: { active: body.active },
      });

      revalidatePath('/');
      revalidatePath('/catalogo');
      revalidatePath('/admin/productos');
      revalidatePath(`/producto/${product.slug}`);

      return NextResponse.json(product);
    }

    // Full form update
    const parsed = normalizeProductInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { tagIds, variants, ...data } = parsed.data;

    const imageUrls = 'imageUrls' in body ? data.imageUrls : existing.imageUrls;

    const [, , product] = await prisma.$transaction([
      prisma.productTag.deleteMany({ where: { productId: id } }),
      prisma.productVariant.deleteMany({ where: { productId: id } }),
      prisma.product.update({
        where: { id },
        data: {
          ...data,
          imageUrls,
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
      })
    ]);

    const newlyUsed = imageUrls.filter(url => !existing.imageUrls.includes(url));
    if (newlyUsed.length > 0) {
      await prisma.imageBandeja.updateMany({
        where: { url: { in: newlyUsed } },
        data: { assigned: true },
      });
    }

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
    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get('hard') === 'true';

    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orderItems: true }
        }
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'El producto no existe o ya fue eliminado.' }, { status: 404 });
    }

    if (hardDelete) {
      // Gate 1: Must be inactive first
      if (existing.active) {
        return NextResponse.json(
          { error: 'Para eliminar permanentemente un producto, primero debes desactivarlo.' },
          { status: 400 }
        );
      }

      // Gate 2: Protect historical order records
      if (existing._count.orderItems > 0) {
        return NextResponse.json(
          { error: `No se puede eliminar permanentemente porque tiene ${existing._count.orderItems} pedido(s) registrado(s). Mantenlo desactivado para conservar el historial de ventas.` },
          { status: 400 }
        );
      }

      // Delete direct single-product discount entries
      await prisma.discount.deleteMany({
        where: { productId: id }
      });

      // ProductVariant, ProductTag, and DiscountProduct cascade-delete via foreign keys
      await prisma.product.delete({
        where: { id }
      });

      // Mark images as unassigned if no other product references them
      if (existing.imageUrls && existing.imageUrls.length > 0) {
        for (const url of existing.imageUrls) {
          const count = await prisma.product.count({
            where: { imageUrls: { has: url } }
          });
          if (count === 0) {
            await prisma.imageBandeja.updateMany({
              where: { url },
              data: { assigned: false }
            });
          }
        }
      }
    } else {
      // Soft-delete by default
      await prisma.product.update({
        where: { id },
        data: { active: false }
      });
    }

    revalidatePath('/');
    revalidatePath('/catalogo');
    revalidatePath('/admin/productos');
    revalidatePath(`/producto/${existing.slug}`);

    return NextResponse.json({ success: true, id, hardDeleted: hardDelete });
  } catch (error) {
    return productErrorResponse(error, '[ADMIN PRODUCTOS DELETE ERROR]');
  }
}
