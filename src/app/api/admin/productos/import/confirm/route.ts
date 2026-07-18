import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import slugify from 'slugify';

export async function POST(req: Request) {
  try {
    const { products } = await req.json();
    let created = 0;
    let updated = 0;

    for (const p of products) {
      // Generate slug if not provided
      const slug = p.slug || slugify(p.name, { lower: true, strict: true });
      
      const exists = await prisma.product.findUnique({ where: { slug } });

      if (exists) {
        await prisma.product.update({
          where: { slug },
          data: {
            name: p.name,
            description: p.description,
            retailPrice: p.retailPrice,
            wholesalePrice: p.wholesalePrice,
            distributorPrice: p.distributorPrice,
            comparePrice: p.comparePrice,
            sku: p.sku,
            stock: p.stock,
            unit: p.unit,
            tones: p.tones,
            categoryId: p.categoryId,
            brandId: p.brandId,
            active: p.active,
            featured: p.featured,
          }
        });
        updated++;
      } else {
        await prisma.product.create({
          data: {
            name: p.name,
            slug,
            description: p.description,
            retailPrice: p.retailPrice,
            wholesalePrice: p.wholesalePrice,
            distributorPrice: p.distributorPrice,
            comparePrice: p.comparePrice,
            sku: p.sku,
            stock: p.stock,
            unit: p.unit,
            tones: p.tones,
            categoryId: p.categoryId,
            brandId: p.brandId,
            active: p.active,
            featured: p.featured,
          }
        });
        created++;
      }
    }

    return NextResponse.json({ created, updated });
  } catch (error) {
    console.error('Error in import confirm:', error);
    return NextResponse.json({ error: 'Error importando productos' }, { status: 500 });
  }
}
