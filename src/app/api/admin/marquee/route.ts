import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const messages = await prisma.marqueeMessage.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(messages);
  } catch (error: any) {
    console.error('[ADMIN MARQUEE GET ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = formData.get('message') as string;
    const active = formData.get('active') !== 'false';

    if (!message) {
      return NextResponse.json({ error: 'El mensaje es requerido' }, { status: 400 });
    }

    const maxOrderMessage = await prisma.marqueeMessage.findFirst({ orderBy: { order: 'desc' } });
    const order = maxOrderMessage ? maxOrderMessage.order + 1 : 0;

    const created = await prisma.marqueeMessage.create({
      data: {
        message,
        order,
        active
      }
    });
    
    revalidatePath('/');
    return NextResponse.json(created);
  } catch (error: any) {
    console.error('[ADMIN MARQUEE POST ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
