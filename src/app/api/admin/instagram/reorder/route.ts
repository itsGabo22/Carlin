import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const { posts } = await req.json();

    if (!Array.isArray(posts)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    await prisma.$transaction(
      posts.map((item: { id: string; order: number }) =>
        prisma.instagramPost.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN INSTAGRAM REORDER ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
