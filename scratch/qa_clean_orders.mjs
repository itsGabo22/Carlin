// Borra SÓLO los pedidos creados por la matriz de QA (customerName exacto).
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();
const NAME = 'QA Tier Test';
const c = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
await c.connect();
const ids = await c.query(`SELECT id FROM "Order" WHERE "customerName" = $1`, [NAME]);
for (const r of ids.rows) {
  await c.query(`DELETE FROM "OrderItem" WHERE "orderId" = $1`, [r.id]);
  await c.query(`DELETE FROM "Order" WHERE id = $1`, [r.id]);
}
console.log(`pedidos QA borrados: ${ids.rowCount}`);
const left = await c.query(`SELECT count(*)::int n FROM "Order"`);
console.log('pedidos restantes en total:', left.rows[0].n);
await c.end();
