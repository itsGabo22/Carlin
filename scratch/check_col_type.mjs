import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

const envFile = fs.readFileSync('.env', 'utf8');
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*"(.*)"\s*$/) || line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    process.env[match[1]] = match[2];
  }
});

async function main() {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  const cols = await client.query(`
    SELECT column_name, data_type, udt_name 
    from information_schema.columns 
    WHERE table_name = 'Product' AND column_name = 'imageUrls';
  `);
  console.log('Product.imageUrls column info:', cols.rows);

  const prod = await client.query(`SELECT id, name, "imageUrls" FROM "Product" WHERE name = 'Collar Perlas';`);
  console.log('Collar Perlas raw row:', prod.rows[0]);

  await client.end();
}

main().catch(console.error);
