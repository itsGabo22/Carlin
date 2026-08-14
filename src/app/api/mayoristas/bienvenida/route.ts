import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Marca el panel de bienvenida como visto para el mayorista autenticado.
 *
 * El usuario se resuelve SIEMPRE desde la cookie de sesión: no acepta ningún id
 * por body, para que nadie pueda cerrarle el panel a otra cuenta.
 * Es idempotente — si ya estaba sellado, no lo vuelve a tocar.
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const result = await prisma.wholesaleUser.updateMany({
      where: { authId: user.id, welcomeSeenAt: null },
      data: { welcomeSeenAt: new Date() },
    });

    return NextResponse.json({ success: true, updated: result.count });
  } catch (error) {
    console.error('Error marcando bienvenida como vista:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
