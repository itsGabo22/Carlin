import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.siteConfig.findUnique({
      where: { id: 'singleton' },
    });

    if (!config) {
      // Return defaults if not seeded
      return NextResponse.json({
        id: 'singleton',
        wholesaleMinOrder: 200000,
        distributorMinOrder: 400000,
        inactivityDays: 30,
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching site config:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
