import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json({ brands });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, slug, description, logoUrl } = await req.json();
    const finalSlug = slug || slugify(name, { lower: true, strict: true });

    const brand = await prisma.brand.create({
      data: { name, slug: finalSlug, description, logoUrl }
    });

    return NextResponse.json(brand);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'El slug o nombre ya existe' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
