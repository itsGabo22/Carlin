import { NextResponse as Response } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { z } from 'zod';

const formSchema = z.object({
  name: z.string().min(2),
  businessName: z.string().min(2),
  taxId: z.string().min(5),
  phone: z.string().min(7),
  city: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['MAYORISTA', 'DISTRIBUIDOR']),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = formSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    
    // 1. Create user in Supabase Auth
    // Because we just use standard supabase client for sign up:
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
        }
      }
    });

    if (authError) {
      return Response.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return Response.json({ error: 'No se pudo crear el usuario en Auth' }, { status: 500 });
    }

    // 2. Create WholesaleUser in Prisma
    const wholesaleUser = await prisma.wholesaleUser.create({
      data: {
        authId: authData.user.id,
        email: data.email,
        name: data.name,
        businessName: data.businessName,
        taxId: data.taxId,
        phone: data.phone,
        role: data.role,
        approved: false, // Must be approved by admin
      }
    });

    // We do NOT sign in the user, they must be approved. But signUp logs them in automatically if email confirmation is off.
    // If they are logged in, carlin-session will just say they are pending.
    
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
