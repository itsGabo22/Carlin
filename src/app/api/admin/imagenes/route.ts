import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assignedStr = searchParams.get('assigned');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 48;
    const skip = (page - 1) * limit;

    let whereClause = {};
    if (assignedStr === 'true') {
      whereClause = { assigned: true };
    } else if (assignedStr === 'false') {
      whereClause = { assigned: false };
    }

    const [images, total] = await Promise.all([
      prisma.imageBandeja.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.imageBandeja.count({ where: whereClause })
    ]);

    return NextResponse.json({
      images,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      }
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
