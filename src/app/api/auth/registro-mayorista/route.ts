import { NextResponse as Response } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2),
  businessName: z.string().min(2),
  taxId: z.string().min(5),
  phone: z.string().min(7),
  city: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * Todo el que se registra queda como MAYORISTA. No hay tipo de cuenta que
 * elegir: "Distribuidor" dejó de ser un track de registro y el precio de
 * distribuidor se gana por tamaño de pedido (ver `resolveWholesaleTier`).
 *
 * Además, el `role` ya NO se lee del cuerpo de la petición. Antes sí, y quien
 * se registraba podía elegir 'DISTRIBUIDOR' y quedarse con el precio más bajo
 * en cuanto un admin aprobara la cuenta. Hoy `role` no decide precios, pero
 * dejarlo fijo aquí evita que vuelva a ser un campo que el cliente controla.
 */
const REGISTRATION_ROLE = 'MAYORISTA' as const;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = formSchema.parse(body);

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Crear el usuario en Supabase Auth YA CONFIRMADO.
    //
    // Antes se usaba `supabase.auth.signUp()`, que dispara el correo de
    // confirmación de Supabase. Eso dejaba el registro en un callejón sin
    // salida: el mayorista quedaba creado pero con `email_confirmed_at = null`,
    // y al intentar entrar recibía "Email not confirmed" traducido como
    // "Credenciales incorrectas". Además el SMTP integrado de Supabase está
    // limitado a ~2 correos/hora, así que a partir del tercer registro en una
    // misma hora el signup fallaba con "email rate limit exceeded".
    //
    // La verificación real de este negocio la hace el admin al aprobar la
    // cuenta desde /admin/mayoristas, así que el doble opt-in por correo no
    // aporta nada: se crea confirmado y el acceso sigue cerrado por `approved`.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        role: REGISTRATION_ROLE,
      },
    });

    if (authError) {
      // Supabase devuelve 422 con este código cuando el correo ya existe en Auth.
      const alreadyExists =
        authError.code === 'email_exists' || /already been registered/i.test(authError.message);
      return Response.json(
        { error: alreadyExists ? 'El correo ya está registrado' : authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return Response.json({ error: 'No se pudo crear el usuario en Auth' }, { status: 500 });
    }

    // 2. Create WholesaleUser in Prisma
    let wholesaleUser;
    try {
      wholesaleUser = await prisma.wholesaleUser.create({
        data: {
          authId: authData.user.id,
          email: data.email,
          name: data.name,
          businessName: data.businessName,
          taxId: data.taxId,
          phone: data.phone,
          city: data.city,
          role: REGISTRATION_ROLE,
          approved: false, // Must be approved by admin
        }
      });
    } catch (err) {
      // Si Prisma falla dejaríamos un usuario huérfano en Auth que además
      // bloquearía el correo para siempre. Lo revertimos.
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id).catch(() => {});
      throw err;
    }

    // No se inicia sesión: la cuenta queda pendiente de aprobación del admin.
    return Response.json({ success: true, user: wholesaleUser });

  } catch (error: any) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return Response.json({ error: 'El correo ya está registrado' }, { status: 400 });
    }
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
