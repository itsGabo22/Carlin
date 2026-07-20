import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── RUTAS COMPLETAMENTE PÚBLICAS ──────────────────────────────────
  // No necesitan ninguna verificación de sesión.
  // Devuelven NextResponse.next() inmediatamente sin tocar Supabase.
  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/catalogo') ||
    pathname.startsWith('/producto') ||
    pathname.startsWith('/marca') ||
    pathname.startsWith('/buscar') ||
    pathname.startsWith('/contacto') ||
    pathname.startsWith('/legal') ||
    pathname.startsWith('/mayoristas') ||     // página info de mayoristas
    pathname === '/carrito' ||
    pathname === '/admin-login' ||
    pathname.startsWith('/registro-mayorista');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ── RUTAS DE AUTH DE MAYORISTAS ───────────────────────────────────
  // /mayoristas/login y /mayoristas/pendiente no necesitan verificación
  // (son páginas públicas de auth)
  if (pathname === '/mayoristas/login' || pathname === '/mayoristas/pendiente') {
    return NextResponse.next();
  }

  // ── RUTAS DEL ADMIN ───────────────────────────────────────────────
  // Solo aquí hacemos getUser() — una llamada a Supabase Auth.
  // Solo afecta a /admin/* rutas, no a todo el sitio.
  if (pathname.startsWith('/admin')) {
    const response = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const isAdmin = user?.user_metadata?.role === 'admin'

    if (!user || !isAdmin) {
      const redirectResponse = NextResponse.redirect(
        new URL('/admin-login', request.url)
      )
      redirectResponse.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate'
      )
      return redirectResponse
    }

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response;
  }

  // ── RUTAS DE PERFIL DE MAYORISTA ─────────────────────────────────
  // /mayoristas/perfil requiere sesión de mayorista aprobado.
  // Usa getSession() aquí (más rápido, cookie local) porque
  // la verificación real del rol se hace en el Server Component.
  if (pathname.startsWith('/mayoristas/perfil')) {
    const response = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    // getSession() es aceptable aquí — solo verificamos si hay cookie.
    // La validación real del rol approved se hace en getSessionResult()
    // dentro del Server Component (que sí usa getUser()).
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/mayoristas/login', request.url))
    }
    return response;
  }

  // Cualquier otra ruta: pasa sin verificación
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Solo rutas que necesitan lógica del proxy.
    // Excluye archivos estáticos explícitamente.
    '/((?!_next/static|_next/image|favicon.ico|icons/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
