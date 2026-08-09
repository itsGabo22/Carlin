import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function checkAdminAuth(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const secureOptions = {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              httpOnly: true,
              sameSite: 'lax' as const,
            };
            request.cookies.set(name, value)
            response.cookies.set(name, value, secureOptions)
          })
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.user_metadata?.role === 'admin';

  return { isAuthenticated: !!user && isAdmin, response };
}

export async function proxy(request: NextRequest) {
  let originalPathname = request.nextUrl.pathname;
  let pathname = originalPathname;

  try {
    // Attempt to decode to catch %2F and other encoded bypasses
    pathname = decodeURIComponent(pathname);
  } catch (err) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }

  // Normalize case and multiple slashes for security matching
  const normalizedPath = pathname.replace(/\/+/g, '/').toLowerCase();

  // ── RUTAS COMPLETAMENTE PÚBLICAS ──────────────────────────────────
  const isPublicRoute =
    normalizedPath === '/' ||
    normalizedPath.startsWith('/catalogo') ||
    normalizedPath.startsWith('/producto') ||
    normalizedPath.startsWith('/marca') ||
    normalizedPath.startsWith('/buscar') ||
    normalizedPath.startsWith('/contacto') ||
    normalizedPath.startsWith('/legal') ||
    normalizedPath.startsWith('/mayoristas') ||
    normalizedPath === '/carrito' ||
    normalizedPath === '/admin-login' ||
    normalizedPath.startsWith('/registro-mayorista');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ── RUTAS DE AUTH DE MAYORISTAS ───────────────────────────────────
  if (normalizedPath === '/mayoristas/login' || normalizedPath === '/mayoristas/pendiente') {
    return NextResponse.next();
  }

  // ── RUTAS DEL ADMIN (UI y API) ───────────────────────────────────────────────
  const isAdminUI = normalizedPath.startsWith('/admin') && normalizedPath !== '/admin-login';
  const isAdminAPI = normalizedPath.startsWith('/api/admin') && normalizedPath !== '/api/admin/auth/login';

  if (isAdminUI || isAdminAPI) {
    const { isAuthenticated, response } = await checkAdminAuth(request);

    if (!isAuthenticated) {
      if (isAdminAPI) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      } else {
        const redirectResponse = NextResponse.redirect(
          new URL('/admin-login', request.url)
        )
        redirectResponse.headers.set(
          'Cache-Control',
          'no-store, no-cache, must-revalidate'
        )
        return redirectResponse
      }
    }

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    return response;
  }

  // ── RUTAS DE PERFIL DE MAYORISTA ─────────────────────────────────
  // /mayoristas/perfil requiere sesión de mayorista aprobado.
  // Usa getSession() aquí (más rápido, cookie local) porque
  // la verificación real del rol se hace en el Server Component.
  if (normalizedPath.startsWith('/mayoristas/perfil')) {
    const response = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const secureOptions = {
                ...options,
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'lax' as const,
              };
              request.cookies.set(name, value)
              response.cookies.set(name, value, secureOptions)
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
    '/api/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|icons/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
