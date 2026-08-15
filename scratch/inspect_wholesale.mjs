// Lectura de diagnóstico: estado de las cuentas mayoristas en Prisma y en Auth.
import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const c = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
await c.connect();
const wu = await c.query(
  `SELECT email, name, city, role, approved, "approvedAt", "lastOrderAt",
          "welcomeDiscountUsedAt", "welcomeSeenAt"
     FROM "WholesaleUser" ORDER BY "createdAt" DESC`
);
console.log('--- WholesaleUser ---');
console.table(wu.rows.map((r) => ({
  email: r.email,
  city: r.city,
  role: r.role,
  approved: r.approved,
  approvedAt: r.approvedAt ? r.approvedAt.toISOString().slice(0, 10) : null,
  lastOrder: r.lastOrderAt ? r.lastOrderAt.toISOString().slice(0, 16) : null,
  welcomeUsed: r.welcomeDiscountUsedAt ? r.welcomeDiscountUsedAt.toISOString().slice(0, 16) : null,
  welcomeSeen: r.welcomeSeenAt ? r.welcomeSeenAt.toISOString().slice(0, 16) : null,
})));

const orders = await c.query(
  `SELECT o.id, o."priceLevel", o.total, o."welcomeDiscountPct", o."welcomeDiscountAmount",
          o."createdAt", w.email
     FROM "Order" o LEFT JOIN "WholesaleUser" w ON w.id = o."wholesaleUserId"
    ORDER BY o."createdAt" DESC LIMIT 10`
);
console.log('--- Órdenes recientes ---');
console.table(orders.rows.map((r) => ({
  id: r.id.slice(-6).toUpperCase(),
  email: r.email,
  level: r.priceLevel,
  total: r.total,
  welcomePct: r.welcomeDiscountPct,
  welcomeAmt: r.welcomeDiscountAmount,
})));
await c.end();

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const { data } = await sb.auth.admin.listUsers({ perPage: 1000 });
console.log('--- Supabase Auth ---');
console.table(data.users.map((u) => ({ email: u.email, confirmed: !!u.email_confirmed_at })));
