import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(
    `UPDATE "SiteConfig"
     SET "catalogMaquillajeUrl" = $1,
         "catalogCapilarUrl" = $2
     WHERE id = 'singleton'`,
    [
      'https://www.canva.com/design/DAGzFXx7LsY/GYD4EUMa1OP2G2nic4Iisw/edit?utm_content=DAGzFXx7LsY&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton',
      'https://www.canva.com/design/DAGzFZWLRXY/Z9aMmf5muAJxhrQJ2slwrw/edit?utm_content=DAGzFZWLRXY&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton',
    ]
  );
  console.log('Updated rows:', res.rowCount);
  await client.end();
  process.exit(0);
}

seed().catch((e) => { console.error(e.message); process.exit(1); });
