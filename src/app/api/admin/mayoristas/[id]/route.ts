import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, role } = body;

    const user = await prisma.wholesaleUser.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'Mayorista no encontrado' }, { status: 404 });
    }

    if (action === 'approve') {
      const updatedUser = await prisma.wholesaleUser.update({
        where: { id },
        data: { approved: true }
      });

      // Send email
      await sendEmail(user.email, '¡Bienvenido al programa de mayoristas de Carlin!', 'Ya puedes acceder con tu cuenta y realizar pedidos con precios especiales.');
      
      return NextResponse.json(updatedUser);
    } 
    
    if (action === 'reject') {
      // 1. Delete from Prisma
      await prisma.wholesaleUser.delete({ where: { id } });
      
      // 2. Delete from Supabase Auth
      if (user.authId) {
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin.auth.admin.deleteUser(user.authId);
      }

      // Send email
      await sendEmail(user.email, 'Actualización sobre tu solicitud', 'Lo sentimos, tu solicitud para el programa de mayoristas no ha sido aprobada en este momento.');

      return NextResponse.json({ success: true, action: 'rejected' });
    }

    if (action === 'revoke') {
      const updatedUser = await prisma.wholesaleUser.update({
        where: { id },
        data: { approved: false }
      });
      return NextResponse.json(updatedUser);
    }

    if (action === 'change_role' && role) {
      const updatedUser = await prisma.wholesaleUser.update({
        where: { id },
        data: { role }
      });
      return NextResponse.json(updatedUser);
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    console.error('Error in mayorista action:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// Fallback email function if Resend is not configured
async function sendEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('\n--- SIMULACIÓN DE EMAIL (Falta RESEND_API_KEY) ---');
    console.log(`Para: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Mensaje: ${text}`);
    console.log('--------------------------------------------------\n');
    return;
  }

  try {
    const { Resend } = require('resend');
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: 'Carlin Cosméticos <no-reply@' + (process.env.RESEND_DOMAIN || 'carlincosmeticos.com') + '>',
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error('Error enviando email con Resend:', err);
  }
}
