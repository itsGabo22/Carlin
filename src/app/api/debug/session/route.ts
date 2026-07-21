import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ priceLevel: "retail", user: null });
    }
    
    const user = await prisma.wholesaleUser.findUnique({
      where: { authId: session.user.id },
    });
    
    let priceLevel = 'retail';
    
    if (user?.role === 'MAYORISTA' && user.approved) {
      priceLevel = 'wholesale';
    } else if (user?.role === 'DISTRIBUIDOR' && user.approved) {
      priceLevel = 'distributor';
    }
    
    return NextResponse.json({
      priceLevel,
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        approved: user.approved,
      } : session.user,
    });
  } catch (error) {
    return NextResponse.json({ priceLevel: "retail", error: String(error) });
  }
}


