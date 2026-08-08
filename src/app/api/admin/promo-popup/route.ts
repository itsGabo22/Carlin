import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';
import { toBlob } from '@/lib/images';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const popup = await prisma.promoPopup.upsert({
      where: { id: 'singleton' },
      create: { id: 'singleton', active: false },
      update: {},
    });
    return NextResponse.json(popup);
  } catch (error) {
    console.error('[ADMIN PROMO POPUP GET ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const formData = await req.formData();

    const active = formData.get('active') === 'true';
    const title = (formData.get('title') as string) || null;
    const subtitle = (formData.get('subtitle') as string) || null;
    const ctaText = (formData.get('ctaText') as string) || 'Ver oferta';
    const ctaHref = (formData.get('ctaHref') as string) || null;
    const showOnce = formData.get('showOnce') === 'true';

    let imageUrl = (formData.get('imageUrl') as string) || undefined;
    const imageFile = formData.get('image') as File | null;

    if (imageFile) {
      const buffer = await imageFile.arrayBuffer();
      const processed = await sharp(Buffer.from(buffer))
        .resize(800, 600, { fit: 'cover' })
        .webp({ quality: 85 })
        .toBuffer();

      const path = 'promo/popup.webp';
      const supabaseAdmin = getSupabaseAdmin();
      const { error } = await supabaseAdmin.storage
        .from('hero-media')
        .upload(path, toBlob(processed, 'image/webp'), { contentType: 'image/webp', upsert: true });

      if (error) {
        console.error('[PROMO POPUP UPLOAD ERROR]', { message: error.message, path });
        return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
      }

      imageUrl = `${supabaseAdmin.storage.from('hero-media').getPublicUrl(path).data.publicUrl}?t=${Date.now()}`;
    }

    const popup = await prisma.promoPopup.upsert({
      where: { id: 'singleton' },
      update: { active, title, subtitle, ctaText, ctaHref, showOnce, ...(imageUrl !== undefined && { imageUrl }) },
      create: {
        id: 'singleton',
        active,
        title,
        subtitle,
        ctaText,
        ctaHref,
        showOnce,
        imageUrl: imageUrl ?? null,
      },
    });

    revalidatePath('/');
    return NextResponse.json(popup);
  } catch (error) {
    console.error('[ADMIN PROMO POPUP PATCH ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
