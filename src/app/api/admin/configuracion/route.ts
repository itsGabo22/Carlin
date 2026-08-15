import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { processAndUploadImage } from '@/lib/images';

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
    
    const wholesaleMinOrder = Number(formData.get('wholesaleMinOrder')) || 200000;
    const distributorMinOrder = Number(formData.get('distributorMinOrder')) || 400000;
    const inactivityDays = Number(formData.get('inactivityDays')) || 30;
    const announcementText = (formData.get('announcementText') as string) || '';
    const announcementActive = formData.get('announcementActive') === 'true';
    const heroUseVideo = formData.get('heroUseVideo') === 'true';
    const catalogMaquillajeUrl = (formData.get('catalogMaquillajeUrl') as string) || '';
    const catalogCapilarUrl = (formData.get('catalogCapilarUrl') as string) || '';
    const welcomeDiscountActive = formData.get('welcomeDiscountActive') === 'true';
    // Se acota a 0–100: un porcentaje fuera de rango dejaría totales absurdos
    // (o negativos) en cada primer pedido.
    const welcomeDiscountPercentage = Math.min(
      100,
      Math.max(0, Number(formData.get('welcomeDiscountPercentage')) || 0)
    );

    // ── Panel de bienvenida ──────────────────────────────────────────
    // Texto plano a propósito: se pinta como texto, nunca como HTML.
    const welcomeTitle = ((formData.get('welcomeTitle') as string) || '').trim() || null;
    const welcomeMessage = ((formData.get('welcomeMessage') as string) || '').trim() || null;

    // `welcomeImageUrl` sólo se toca si el admin subió una imagen nueva o pidió
    // quitarla; si no viene nada en el form, se deja la que ya estaba.
    let welcomeImageUrl: string | null | undefined;
    const welcomeImageFile = formData.get('welcomeImage') as File | null;
    const removeWelcomeImage = formData.get('removeWelcomeImage') === 'true';

    if (welcomeImageFile && welcomeImageFile.size > 0) {
      // `fit: inside` + sin ampliar: respeta la proporción del diseño que
      // subieron, no lo recorta. La imagen se muestra sin texto encima.
      const publicUrl = await processAndUploadImage({
        file: welcomeImageFile,
        bucket: 'hero-media',
        path: 'mayoristas/bienvenida.webp',
        resize: { width: 1200, height: 800, fit: 'inside', withoutEnlargement: true },
        quality: 88,
        upsert: true,
      });
      // Cache-bust: la ruta es fija, así que sin esto el navegador seguiría
      // mostrando la imagen anterior.
      welcomeImageUrl = `${publicUrl}?t=${Date.now()}`;
    } else if (removeWelcomeImage) {
      welcomeImageUrl = null;
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
        catalogMaquillajeUrl: catalogMaquillajeUrl || null,
        catalogCapilarUrl: catalogCapilarUrl || null,
        welcomeDiscountActive,
        welcomeDiscountPercentage,
        welcomeTitle,
        welcomeMessage,
        ...(welcomeImageUrl !== undefined && { welcomeImageUrl }),
      },
      create: {
        id: 'singleton',
        wholesaleMinOrder,
        distributorMinOrder,
        inactivityDays,
        announcementText,
        announcementActive,
        heroUseVideo,
        catalogMaquillajeUrl: catalogMaquillajeUrl || null,
        catalogCapilarUrl: catalogCapilarUrl || null,
        welcomeDiscountActive,
        welcomeDiscountPercentage,
        welcomeTitle,
        welcomeMessage,
        ...(welcomeImageUrl !== undefined && { welcomeImageUrl }),
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
