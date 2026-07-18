import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Convert tags format for Prisma
    const tagsConnect = body.tags ? {
      create: body.tags.map((tagId: string) => ({
        tag: { connect: { id: tagId } }
      }))
    } : undefined;

    const product = await prisma.product.upsert({
      where: { slug: body.slug },
      update: {
        name: body.name,
        description: body.description,
        retailPrice: body.retailPrice,
        wholesalePrice: body.wholesalePrice,
        distributorPrice: body.distributorPrice,
        comparePrice: body.comparePrice,
        sku: body.sku,
        stock: body.stock,
        unit: body.unit,
        tones: body.tones || [],
        imageUrls: body.imageUrls || [],
        featured: body.featured,
        active: body.active,
        categoryId: body.categoryId,
        brandId: body.brandId || null,
        // For update, tags must be handled separately or fully replaced
      },
      create: {
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
        tones: body.tones || [],
        imageUrls: body.imageUrls || [],
        featured: body.featured,
        active: body.active,
        categoryId: body.categoryId,
        brandId: body.brandId || null,
        tags: tagsConnect,
      }
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
