import type { NextConfig } from "next";

// Origen de Supabase (Storage para imágenes, Auth para el login de mayoristas).
const SUPABASE_ORIGIN =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zkjxlmuggcqlmhspbtlg.supabase.co';
const SUPABASE_WS = SUPABASE_ORIGIN.replace(/^https:/, 'wss:');

// OJO: sin `connect-src` explícito, fetch/XHR caen en `default-src 'self'` y el
// navegador bloquea las llamadas de supabase-js a /auth/v1/*. Eso deja el login
// de mayoristas (supabase.auth.signInWithPassword desde el cliente) sin poder
// autenticar, mostrando "Credenciales incorrectas" aunque la clave sea correcta.
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: ${SUPABASE_ORIGIN};
  font-src 'self' data:;
  connect-src 'self' ${SUPABASE_ORIGIN} ${SUPABASE_WS};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\n/g, '');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeader,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
