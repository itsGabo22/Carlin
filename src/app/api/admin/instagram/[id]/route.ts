import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { processAndUploadImage, safeStorageName } from '@/lib/images';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await req.formData();

    const updateData: any = {};
    if (formData.has('linkUrl')) updateData.linkUrl = ((formData.get('linkUrl') as string) || '').trim();
    if (formData.has('active')) updateData.active = formData.get('active') !== 'false';

    const imageFile = formData.get('image') as File | null;
    if (imageFile && imageFile.size > 0) {
      updateData.imageUrl = await processAndUploadImage({
        file: imageFile,
        bucket: 'hero-media',
        path: `instagram/${Date.now()}-${safeStorageName(imageFile.name)}.webp`,
        resize: { width: 1080, height: 1350, fit: 'cover', withoutEnlargement: true },
        quality: 85,
      });
    }

    const updated = await prisma.instagramPost.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/');
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[ADMIN INSTAGRAM PATCH ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await prisma.instagramPost.delete({ where: { id } });

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN INSTAGRAM DELETE ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
