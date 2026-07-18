import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();

    // Handle tag relationships
    if (body.tags) {
      await prisma.productTag.deleteMany({
        where: { productId: id }
      });
    }

    const tagsConnect = body.tags ? {
      create: body.tags.map((tagId: string) => ({
        tag: { connect: { id: tagId } }
      }))
    } : undefined;

    const product = await prisma.product.update({
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
        tags: tagsConnect,
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Soft delete: set active = false
    const product = await prisma.product.update({
      where: { id },
      data: { active: false }
    });

    // Optional: physically delete images from Supabase Storage if you want
    // But since it's a soft delete, keeping the images might be better.
    // If it was a hard delete, we would do:
    // const urls = product.imageUrls;
    // urls.forEach(async (url) => { ... storage remove logic ... });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
