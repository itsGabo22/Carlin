import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { processAndUploadImage, safeStorageName } from '@/lib/images';

export async function GET() {
  try {
    const posts = await prisma.instagramPost.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(posts);
  } catch (error: any) {
    console.error('[ADMIN INSTAGRAM GET ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const linkUrl = ((formData.get('linkUrl') as string) || '').trim();
    const active = formData.get('active') !== 'false';
    const imageFile = formData.get('image') as File | null;

    if (!linkUrl) {
      return NextResponse.json({ error: 'El enlace es requerido' }, { status: 400 });
    }
    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: 'La imagen es requerida' }, { status: 400 });
    }

    // Ruta única por entrada: así borrar una no afecta a las demás.
    const imageUrl = await processAndUploadImage({
      file: imageFile,
      bucket: 'hero-media',
      path: `instagram/${Date.now()}-${safeStorageName(imageFile.name)}.webp`,
      // Formato vertical tipo reel, sin ampliar imágenes pequeñas.
      resize: { width: 1080, height: 1350, fit: 'cover', withoutEnlargement: true },
      quality: 85,
    });

    const last = await prisma.instagramPost.findFirst({ orderBy: { order: 'desc' } });
    const order = last ? last.order + 1 : 0;

    const created = await prisma.instagramPost.create({
      data: { imageUrl, linkUrl, order, active }
    });

    revalidatePath('/');
    return NextResponse.json(created);
  } catch (error: any) {
    console.error('[ADMIN INSTAGRAM POST ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
