import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { ContactoSchema } from '@/lib/validators';

const CARLIN_CONTACT_EMAIL = 'carlincosmeticos@hotmail.com';

export async function POST(req: NextRequest) {
  try {
    const parsed = ContactoSchema.safeParse(await req.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: first?.message || 'Datos inválidos' }, { status: 400 });
    }

    const { name, email, phone, message } = parsed.data;

    // Se guarda primero: el mensaje no debe perderse aunque el correo de
    // notificación falle o Resend no esté configurado en este entorno.
    const submission = await prisma.contactSubmission.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        message,
      },
    });

    const emailSent = await sendContactNotification({ name, email, phone, message });
    if (emailSent) {
      await prisma.contactSubmission.update({
        where: { id: submission.id },
        data: { emailSent: true },
      });
    }

    // El envío es "best effort": el usuario ya recibió respuesta correcta
    // porque su mensaje quedó guardado, independientemente de Resend.
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[CONTACTO ERROR]', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

async function sendContactNotification({
  name,
  email,
  phone,
  message,
}: {
  name: string;
  email?: string;
  phone?: string;
  message: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('\n--- SIMULACIÓN DE EMAIL (Falta RESEND_API_KEY) ---');
    console.log(`De: ${name} (${email || 'sin email'} / ${phone || 'sin teléfono'})`);
    console.log(`Mensaje: ${message}`);
    console.log('--------------------------------------------------\n');
    return false;
  }

  // Mientras `RESEND_DOMAIN` no esté verificado, se usa el dominio de prueba
  // de Resend con el nombre de marca como display name. En cuanto se añada
  // `RESEND_DOMAIN`, empieza a usarse automáticamente sin tocar código.
  const from = process.env.RESEND_DOMAIN
    ? `Carlin Cosméticos <notificaciones@${process.env.RESEND_DOMAIN}>`
    : 'Carlin Cosméticos <onboarding@resend.dev>';

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: CARLIN_CONTACT_EMAIL,
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `Nombre: ${name}\nEmail: ${email || '(no proporcionado)'}\nTeléfono: ${phone || '(no proporcionado)'}\n\nMensaje:\n${message}`,
    });
    return true;
  } catch (err) {
    console.error('Error enviando notificación de contacto con Resend:', err);
    return false;
  }
}
