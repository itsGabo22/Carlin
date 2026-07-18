import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();

    if (pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    
    response.cookies.set('admin_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 28800, // 8 hours
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
