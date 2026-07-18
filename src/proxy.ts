import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request: NextRequest) {
  // 1. Always refresh Supabase session first
  const response = await updateSession(request);

  // 2. Then check admin PIN for /admin/* routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session');
    const isLoginPage = request.nextUrl.pathname === '/admin/login';
    if (!adminSession && !isLoginPage) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
