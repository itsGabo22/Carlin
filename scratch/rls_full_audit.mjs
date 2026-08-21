// Auditoría RLS: estado real en Postgres (no confiar en el .sql del repo).
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const c = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
await c.connect();

const tables = await c.query(
  `SELECT c.relname AS table, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
          (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS policy_count
     FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname`
);
console.log('=== TABLAS public: RLS + nº de políticas ===');
console.table(tables.rows);

const pol = await c.query(
  `SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
     FROM pg_policies WHERE schemaname = 'public'
    ORDER BY tablename, policyname`
);
console.log(`\n=== ${pol.rows.length} POLÍTICAS ACTIVAS (texto completo) ===`);
for (const r of pol.rows) {
  console.log(`\n--- ${r.tablename} :: "${r.policyname}"`);
  console.log(`    cmd=${r.cmd}  permissive=${r.permissive}  roles=${r.roles}`);
  console.log(`    USING      : ${r.qual ?? '(none)'}`);
  console.log(`    WITH CHECK : ${r.with_check ?? '(none)'}`);
}

console.log('\n=== BÚSQUEDA DEL PATRÓN "IS NULL" EN CUALQUIER POLÍTICA ===');
const sus = pol.rows.filter((r) =>
  /IS NULL/i.test(`${r.qual ?? ''} ${r.with_check ?? ''}`)
);
if (!sus.length) console.log('Ninguna política contiene "IS NULL".');
for (const r of sus) console.log(`⚠  ${r.tablename} :: "${r.policyname}" (${r.cmd}) roles=${r.roles}\n   ${r.qual}`);

console.log('\n=== TABLAS SIN RLS O CON RLS SIN NINGUNA POLÍTICA ===');
for (const t of tables.rows) {
  if (!t.rls_enabled) console.log(`⚠  ${t.table}: RLS DESACTIVADO`);
  else if (Number(t.policy_count) === 0) console.log(`ok(deny-all) ${t.table}: RLS on, 0 políticas → todo denegado a anon`);
}
await c.end();
