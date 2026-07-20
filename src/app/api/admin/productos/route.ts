import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { 
        category: true, 
        brand: true,
        tags: { include: { tag: true } } 
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
    const body = await req.json();
    
    const tagIds: string[] = body.tags || [];

    const product = await prisma.product.create({
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
        tones: body.tones || [],
        imageUrls: body.imageUrls || [],
        featured: body.featured,
        active: body.active,
        categoryId: body.categoryId,
        brandId: body.brandId || null,
        tags: {
          create: tagIds.map(tagId => ({ tagId }))
        },
      }
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('[ADMIN PRODUCTOS POST ERROR]', error);
    return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
  }
}
