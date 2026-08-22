// Diagnóstico para el cambio de reglas de precio (un solo tier mayorista).
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const c = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
await c.connect();

const cfg = await c.query(`SELECT "wholesaleMinOrder","distributorMinOrder","inactivityDays",
  "welcomeDiscountActive","welcomeDiscountPercentage" FROM "SiteConfig" WHERE id='singleton'`);
console.log('--- SiteConfig ---');
console.table(cfg.rows);

const roles = await c.query(`SELECT role, approved, count(*)::int AS n
  FROM "WholesaleUser" GROUP BY role, approved ORDER BY role`);
console.log('--- WholesaleUser por role/approved ---');
console.table(roles.rows);

const prods = await c.query(`SELECT name, "retailPrice","wholesalePrice","distributorPrice", active, stock
  FROM "Product" WHERE active = true ORDER BY "wholesalePrice" DESC LIMIT 8`);
console.log('--- Productos activos (top precio mayorista) ---');
console.table(prods.rows);

const disc = await c.query(`SELECT name, audience, active, "couponCode", percentage FROM "Discount"`);
console.log('--- Discounts ---');
console.table(disc.rows);

await c.end();
