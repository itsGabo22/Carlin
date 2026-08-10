import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    await prisma.$transaction(
      messages.map((item: { id: string, order: number }) => 
        prisma.marqueeMessage.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );
    
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN MARQUEE REORDER ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
