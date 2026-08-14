// Reparación única: los mayoristas registrados con el flujo viejo
// (`supabase.auth.signUp`) quedaron con `email_confirmed_at = null` porque nunca
// abrieron el correo de confirmación. Aunque el admin los aprobara, al iniciar
// sesión recibían "Email not confirmed". El registro nuevo ya los crea
// confirmados; esto arregla a los que quedaron atrapados.
//
// Sólo marca el correo como confirmado: NO cambia contraseñas, ni roles, ni el
// estado `approved` (que sigue siendo decisión del admin).
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data, error } = await sb.auth.admin.listUsers({ perPage: 1000 });
if (error) throw error;

const pending = data.users.filter((u) => !u.email_confirmed_at);
console.log(`Sin confirmar: ${pending.length}`);

for (const u of pending) {
  const { error: updErr } = await sb.auth.admin.updateUserById(u.id, { email_confirm: true });
  console.log(` - ${u.email}: ${updErr ? 'ERROR ' + updErr.message : 'confirmado'}`);
}
