import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const popup = await prisma.promoPopup.findUnique({
      where: { id: 'singleton' },
    });

    if (!popup || !popup.active) {
      return NextResponse.json(null);
    }

    return NextResponse.json(popup);
  } catch (error) {
    console.error('Error fetching promo popup:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
