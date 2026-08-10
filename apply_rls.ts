import { Client } from 'pg';
import { config } from 'dotenv';
config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query('ALTER TABLE "MarqueeMessage" ENABLE ROW LEVEL SECURITY;');
  await client.query('CREATE POLICY "marquee_public" ON "MarqueeMessage" FOR SELECT USING (active = true);');
  console.log('RLS applied');
  await client.end();
}
main();
