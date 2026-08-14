// Backfill único: las cuentas mayoristas aprobadas antes de que existiera la
// columna `approvedAt` la tienen en NULL. Sin fecha base, isWholesaleActive()
// las deja en precio de detal. Se usa `createdAt` como aproximación.
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
await client.connect();

const res = await client.query(
  `UPDATE "WholesaleUser"
      SET "approvedAt" = "createdAt"
    WHERE approved = true AND "approvedAt" IS NULL
    RETURNING email, "approvedAt"`
);

console.log(`Cuentas actualizadas: ${res.rowCount}`);
console.table(res.rows);

await client.end();
