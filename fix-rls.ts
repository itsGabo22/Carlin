import { Client } from 'pg';
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  
  // Enable RLS
  await client.query('ALTER TABLE "LoginAttempt" ENABLE ROW LEVEL SECURITY;');
  
  // No policy added = Deny all to anon/authenticated
  // Explicitly deny for clarity if wanted, but default is deny all when RLS is enabled without policies.
  // We will just leave it without policies, which denies all to anon/authenticated.

  console.log('RLS enabled on LoginAttempt');
  
  const res = await client.query("SELECT schemaname,tablename,rowsecurity FROM pg_tables WHERE schemaname='public' AND rowsecurity=false;");
  console.log('Tables without RLS:', JSON.stringify(res.rows, null, 2));
  
  await client.end();
}

main().catch(console.error);
