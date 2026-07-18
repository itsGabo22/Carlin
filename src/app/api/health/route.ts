import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Simple query to verify DB connection
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', timestamp: new Date() });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: 'Database connection failed' }, { status: 503 });
  }
}
