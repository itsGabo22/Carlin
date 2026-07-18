import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const text = await file.text();
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });

    const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
    const brands = await prisma.brand.findMany({ select: { id: true, slug: true } });

    const valid: any[] = [];
    const errors: any[] = [];

    result.data.forEach((row: any, index: number) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header

      if (!row.nombre || row.nombre.trim() === '') {
        errors.push({ row: rowNum, field: 'nombre', message: 'Obligatorio' });
        return;
      }

      const cat = categories.find(c => c.slug === row.categoria_slug);
      if (!cat) {
        errors.push({ row: rowNum, field: 'categoria_slug', message: `Categoría '${row.categoria_slug}' no existe` });
        return;
      }

      let brandId = null;
      if (row.marca_slug && row.marca_slug.trim() !== '') {
        const brand = brands.find(b => b.slug === row.marca_slug);
        if (!brand) {
          errors.push({ row: rowNum, field: 'marca_slug', message: `Marca '${row.marca_slug}' no existe` });
          return;
        }
        brandId = brand.id;
      }

      const retailPrice = parseFloat(row.precio_retail);
      const wholesalePrice = parseFloat(row.precio_mayorista);
      const distributorPrice = parseFloat(row.precio_distribuidor);

      if (isNaN(retailPrice) || isNaN(wholesalePrice) || isNaN(distributorPrice)) {
        errors.push({ row: rowNum, field: 'precios', message: 'Deben ser números válidos' });
        return;
      }

      valid.push({
        name: row.nombre,
        slug: row.slug || undefined, // auto-generated if missing
        description: row.descripcion || '',
        retailPrice,
        wholesalePrice,
        distributorPrice,
        comparePrice: row.precio_comparativo ? parseFloat(row.precio_comparativo) : null,
        sku: row.sku || null,
        stock: parseInt(row.stock) || 0,
        unit: row.unidad || 'unidad',
        categoryId: cat.id,
        brandId,
        active: row.activo !== 'FALSE',
        featured: row.destacado === 'TRUE',
        tones: row.tonos ? row.tonos.split('|') : [],
        // Just for preview in UI
        categoria_slug: row.categoria_slug,
      });
    });

    return NextResponse.json({ valid, errors });
  } catch (error) {
    return NextResponse.json({ error: 'Error procesando CSV' }, { status: 500 });
  }
}
