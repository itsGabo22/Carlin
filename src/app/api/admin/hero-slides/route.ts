import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { active: true },
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(slides);
  } catch (error: any) {
    console.error('[ADMIN HERO SLIDES GET ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import sharp from 'sharp';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const type = formData.get('type') as 'IMAGE' | 'VIDEO' || 'IMAGE';
    const title = formData.get('title') as string || null;
    const subtitle = formData.get('subtitle') as string || null;
    const ctaText = formData.get('ctaText') as string || null;
    const ctaHref = formData.get('ctaHref') as string || null;
    
    let desktopUrl = formData.get('desktopUrl') as string || '';
    let mobileUrl = formData.get('mobileUrl') as string || null;
    
    const desktopFile = formData.get('desktop') as File | null;
    const mobileFile = formData.get('mobile') as File | null;
    const videoFile = formData.get('video') as File | null;

    const supabaseAdmin = getSupabaseAdmin();
    const tempId = Date.now().toString();

    if (type === 'IMAGE') {
      if (desktopFile) {
        const buffer = await desktopFile.arrayBuffer();
        const processed = await sharp(Buffer.from(buffer)).resize(1920, 1080, { fit: 'cover' }).webp({ quality: 85 }).toBuffer();
        
        const sanitizedName = desktopFile.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-');
        const path = `slides/${Date.now()}-desktop-${sanitizedName.replace(/\.[^/.]+$/, "")}.webp`;

        const { data, error } = await supabaseAdmin.storage.from('hero-media').upload(path, processed, { contentType: 'image/webp', upsert: true });

        if (error) {
          console.error('[HERO UPLOAD ERROR]', {
            message: error.message,
            path,
            fileType: 'image/webp',
            fileSize: processed.byteLength,
          });
          return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
        }
        desktopUrl = supabaseAdmin.storage.from('hero-media').getPublicUrl(path).data.publicUrl;
      }
      if (mobileFile) {
        const buffer = await mobileFile.arrayBuffer();
        const processed = await sharp(Buffer.from(buffer)).resize(800, 1000, { fit: 'cover' }).webp({ quality: 85 }).toBuffer();
        
        const sanitizedName = mobileFile.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-');
        const path = `slides/${Date.now()}-mobile-${sanitizedName.replace(/\.[^/.]+$/, "")}.webp`;

        const { data, error } = await supabaseAdmin.storage.from('hero-media').upload(path, processed, { contentType: 'image/webp', upsert: true });

        if (error) {
          console.error('[HERO UPLOAD ERROR]', {
            message: error.message,
            path,
            fileType: 'image/webp',
            fileSize: processed.byteLength,
          });
          return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
        }
        mobileUrl = supabaseAdmin.storage.from('hero-media').getPublicUrl(path).data.publicUrl;
      }
    } else {
      if (videoFile) {
        const buffer = await videoFile.arrayBuffer();
        
        const sanitizedName = videoFile.name.toLowerCase().replace(/[^a-z0-9.-]/g, '-').replace(/-+/g, '-');
        const path = `slides/${Date.now()}-${sanitizedName}`;

        const { data, error } = await supabaseAdmin.storage.from('hero-media').upload(path, Buffer.from(buffer), { contentType: videoFile.type, upsert: true });

        if (error) {
          console.error('[HERO UPLOAD ERROR]', {
            message: error.message,
            path,
            fileType: videoFile.type,
            fileSize: buffer.byteLength,
          });
          return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
        }
        desktopUrl = supabaseAdmin.storage.from('hero-media').getPublicUrl(path).data.publicUrl;
      }
    }

    const maxOrderSlide = await prisma.heroSlide.findFirst({ orderBy: { order: 'desc' } });
    const order = maxOrderSlide ? maxOrderSlide.order + 1 : 0;

    const slide = await prisma.heroSlide.create({
      data: {
        type, desktopUrl, mobileUrl, title, subtitle, ctaText, ctaHref, order
      }
    });
    
    revalidatePath('/');
    return NextResponse.json(slide);
  } catch (error: any) {
    console.error('[ADMIN HERO SLIDES POST ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
