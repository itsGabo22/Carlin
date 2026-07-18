import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let config = await prisma.siteConfig.findUnique({
      where: { id: 'singleton' }
    });

    if (!config) {
      config = await prisma.siteConfig.create({
        data: {
          id: 'singleton',
          wholesaleMinOrder: 200000,
          distributorMinOrder: 400000,
          inactivityDays: 30,
        }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import sharp from 'sharp';

export async function PATCH(req: Request) {
  try {
    const formData = await req.formData();
    
    // Parse config fields
    const wholesaleMinOrder = Number(formData.get('wholesaleMinOrder'));
    const distributorMinOrder = Number(formData.get('distributorMinOrder'));
    const inactivityDays = Number(formData.get('inactivityDays'));
    const announcementText = formData.get('announcementText') as string;
    const announcementActive = formData.get('announcementActive') === 'true';
    const heroUseVideo = formData.get('heroUseVideo') === 'true';

    const supabaseAdmin = getSupabaseAdmin();

    // Handle files
    const desktopFile = formData.get('desktop') as File | null;
    const mobileFile = formData.get('mobile') as File | null;
    const videoFile = formData.get('video') as File | null;

    if (desktopFile) {
      const buffer = Buffer.from(await desktopFile.arrayBuffer());
      const processed = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      await supabaseAdmin.storage.from('hero-media').upload('hero/desktop.webp', processed, { contentType: 'image/webp', upsert: true });
    }

    if (mobileFile) {
      const buffer = Buffer.from(await mobileFile.arrayBuffer());
      const processed = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      await supabaseAdmin.storage.from('hero-media').upload('hero/mobile.webp', processed, { contentType: 'image/webp', upsert: true });
    }

    if (videoFile) {
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      // For video, keep original content type
      await supabaseAdmin.storage.from('hero-media').upload('hero/video' + (videoFile.type === 'video/webm' ? '.webm' : '.mp4'), buffer, { contentType: videoFile.type, upsert: true });
    }

    const config = await prisma.siteConfig.upsert({
      where: { id: 'singleton' },
      update: {
        wholesaleMinOrder,
        distributorMinOrder,
        inactivityDays,
        announcementText,
        announcementActive,
        heroUseVideo,
      },
      create: {
        id: 'singleton',
        wholesaleMinOrder,
        distributorMinOrder,
        inactivityDays,
        announcementText,
        announcementActive,
        heroUseVideo,
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error actualizando config:', error);
    return NextResponse.json({ error: 'Error actualizando configuración' }, { status: 500 });
  }
}
