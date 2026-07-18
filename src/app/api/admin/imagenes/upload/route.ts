import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import slugify from 'slugify';

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

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image with sharp
    const processedBuffer = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    // Create unique filename
    const originalName = file.name.split('.')[0];
    const safeName = slugify(originalName, { lower: true, strict: true });
    const filename = `${Date.now()}-${safeName}.webp`;
    const path = bucket === 'brand-logos' ? `logos/${filename}` : `bandeja/${filename}`;

    // Upload to Supabase Storage
    const supabaseAdmin = getSupabaseAdmin();
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, processedBuffer, {
        contentType: 'image/webp',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Error al subir la imagen a Supabase' }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

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
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
