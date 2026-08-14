// Ajusta el descuento de bienvenida sin pasar por el panel admin.
// Uso: node scratch/set_welcome_discount.mjs <activo:true|false> <porcentaje>
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const active = (process.argv[2] ?? 'true') === 'true';
const percentage = Number(process.argv[3] ?? 15);

const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
await client.connect();

const res = await client.query(
  `UPDATE "SiteConfig"
      SET "welcomeDiscountActive" = $1,
          "welcomeDiscountPercentage" = $2,
          "updatedAt" = now()
    WHERE id = 'singleton'
    RETURNING "welcomeDiscountActive", "welcomeDiscountPercentage"`,
  [active, percentage]
);

console.table(res.rows);
await client.end();
