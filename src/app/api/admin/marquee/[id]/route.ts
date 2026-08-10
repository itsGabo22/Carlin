import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const formData = await req.formData();
    
    const updateData: any = {};
    if (formData.has('message')) updateData.message = formData.get('message') as string;
    if (formData.has('active')) updateData.active = formData.get('active') !== 'false';

    const updated = await prisma.marqueeMessage.update({
      where: { id },
      data: updateData
    });
    
    revalidatePath('/');
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[ADMIN MARQUEE PATCH ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    await prisma.marqueeMessage.delete({
      where: { id }
    });
    
    revalidatePath('/');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[ADMIN MARQUEE DELETE ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
