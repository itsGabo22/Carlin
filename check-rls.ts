import { Client } from 'pg';
require('dotenv').config();
async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  const res = await client.query("SELECT schemaname,tablename,rowsecurity FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;");
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
main().catch(console.error);
