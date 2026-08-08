import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    // Get IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';

    // Rate Limiting check: max 5 failed attempts in 5 minutes per IP
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentAttempts = await prisma.loginAttempt.count({
      where: {
        ip,
        createdAt: { gte: fiveMinutesAgo },
        success: false
      }
    });

    if (recentAttempts >= 5) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta de nuevo más tarde.' }, 
        { status: 429 }
      );
    }

    const response = NextResponse.json({ success: true });
    
    // Server-side Supabase Client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return req.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const secureOptions = {
                ...options,
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'lax' as const,
              };
              req.cookies.set(name, value);
              response.cookies.set(name, value, secureOptions);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      await prisma.loginAttempt.create({
        data: { ip, email, success: false }
      });
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    if (data.user?.user_metadata?.role !== 'admin') {
      await supabase.auth.signOut();
      await prisma.loginAttempt.create({
        data: { ip, email, success: false }
      });
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    await prisma.loginAttempt.create({
      data: { ip, email, success: true }
    });

    return response;
  } catch (err) {
    console.error('[ADMIN LOGIN ERROR]', err);
    return NextResponse.json({ error: 'Error de conexión' }, { status: 500 });
  }
}
