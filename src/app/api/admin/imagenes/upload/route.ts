import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { processAndUploadImage, safeStorageName } from '@/lib/images';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as string || 'product-images'; // For optional reusability

    if (!file) {
      return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'La imagen debe pesar menos de 10MB' }, { status: 400 });
    }

    // Create unique filename
    const filename = `${Date.now()}-${safeStorageName(file.name)}.webp`;
    const folderByBucket: Record<string, string> = {
      'brand-logos': 'logos',
      'category-images': 'categorias',
    };
    const path = `${folderByBucket[bucket] ?? 'bandeja'}/${filename}`;

    // sharp → WebP → Blob-wrap → Supabase Storage (ver src/lib/images.ts)
    const publicUrl = await processAndUploadImage({
      file,
      bucket,
      path,
      resize: { width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true },
      quality: 82,
    });

    // If it's a product image, save it in ImageBandeja
    if (bucket === 'product-images') {
      const imageRecord = await prisma.imageBandeja.create({
        data: {
          url: publicUrl,
          filename: file.name, // original filename for reference
          assigned: false,
        }
      });
      return NextResponse.json(imageRecord);
    }

    return NextResponse.json({ url: publicUrl, filename: file.name });

  } catch (error) {
    console.error('Image upload processing error:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
