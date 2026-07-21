import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  let key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!key) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY no está configurada en .env. Usando ANON KEY como fallback (puede causar errores de permisos 403).');
    key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }
  
  if (!key) throw new Error('No se encontró ninguna llave de Supabase (.env)');
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
