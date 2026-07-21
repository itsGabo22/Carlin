import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const slides: { id: string; order: number }[] = body.slides;

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    await prisma.$transaction(
      slides.map(s => prisma.heroSlide.update({
        where: { id: s.id },
        data: { order: s.order }
      }))
    );

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN HERO SLIDES REORDER ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
