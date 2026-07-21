import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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

export async function PATCH(req: Request) {
  try {
    const formData = await req.formData();
    
    // Parse config fields
    const wholesaleMinOrder = Number(formData.get('wholesaleMinOrder')) || 200000;
    const distributorMinOrder = Number(formData.get('distributorMinOrder')) || 400000;
    const inactivityDays = Number(formData.get('inactivityDays')) || 30;
    const announcementText = (formData.get('announcementText') as string) || '';
    const announcementActive = formData.get('announcementActive') === 'true';
    const heroUseVideo = formData.get('heroUseVideo') === 'true';

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
    
    revalidatePath('/');
    revalidatePath('/catalogo');

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error actualizando config:', error);
    return NextResponse.json({ error: 'Error actualizando configuración' }, { status: 500 });
  }
}
