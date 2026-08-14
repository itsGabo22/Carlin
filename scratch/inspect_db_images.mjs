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

  const prods = await client.query('SELECT id, name, slug, "imageUrls", "createdAt" FROM "Product" ORDER BY "createdAt" DESC LIMIT 15;');
  console.log('--- RECENT PRODUCTS ---');
  prods.rows.forEach(p => {
    console.log(`Product: "${p.name}" (slug: ${p.slug})`);
    console.log(`  Created: ${p.createdAt}`);
    console.log(`  imageUrls:`, p.imageUrls);
  });

  const bandeja = await client.query('SELECT id, url, assigned, "createdAt" FROM "ImageBandeja" ORDER BY "createdAt" DESC LIMIT 10;');
  console.log('\n--- RECENT BANDEJA IMAGES ---');
  bandeja.rows.forEach(b => {
    console.log(`Bandeja img: ${b.url}`);
    console.log(`  Assigned: ${b.assigned}`);
  });

  await client.end();
}

main().catch(console.error);
