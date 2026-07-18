import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true, children: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, slug, description, imageUrl, parentId, groupByBrand } = await req.json();
    const finalSlug = slug || slugify(name, { lower: true, strict: true });

    const category = await prisma.category.create({
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
