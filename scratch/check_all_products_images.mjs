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

  const allProds = await client.query('SELECT id, name, slug, "imageUrls", "createdAt" FROM "Product" ORDER BY "createdAt" DESC;');
  console.log(`TOTAL PRODUCTS IN DB: ${allProds.rows.length}\n`);

  const withoutImages = allProds.rows.filter(p => !p.imageUrls || p.imageUrls.length === 0);
  const withImages = allProds.rows.filter(p => p.imageUrls && p.imageUrls.length > 0);

  console.log(`PRODUCTS WITH IMAGES (${withImages.length}):`);
  withImages.forEach(p => console.log(` - "${p.name}" (slug: ${p.slug}): ${JSON.stringify(p.imageUrls)}`));

  console.log(`\nPRODUCTS WITHOUT IMAGES (${withoutImages.length}):`);
  withoutImages.forEach(p => console.log(` - "${p.name}" (slug: ${p.slug}, created: ${p.createdAt})`));

  await client.end();
}

main().catch(console.error);
