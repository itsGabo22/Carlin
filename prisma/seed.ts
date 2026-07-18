import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding database...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);

  // 1. SiteConfig
  await prisma.siteConfig.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      wholesaleMinOrder: 200000,
      distributorMinOrder: 400000,
      inactivityDays: 30,
    },
  });
  console.log('SiteConfig seeded.');

  // 2. Tags
  const tagsData = [
    { name: 'Nuevo', slug: 'nuevo' },
    { name: 'Más Vendido', slug: 'mas-vendido' },
    { name: 'En Oferta', slug: 'en-oferta' },
    { name: 'Tendencia', slug: 'tendencia' },
    { name: 'Agotado', slug: 'agotado' },
  ];
  for (const t of tagsData) {
    await prisma.tag.upsert({
      where: { slug: t.slug },
      update: {},
      create: t,
    });
  }
  console.log('Tags seeded.');

  // 3. Brands
  const brandsData = [
    { name: 'Dolce Bella', slug: 'dolce-bella' },
    { name: 'OG', slug: 'og' },
    { name: 'Pin Up Glow', slug: 'pin-up-glow' },
    { name: 'Poccion', slug: 'poccion' },
    { name: 'Milagros', slug: 'milagros' },
    { name: 'Anyluz', slug: 'anyluz' },
    { name: 'Kaba', slug: 'kaba' },
    { name: 'Atenea', slug: 'atenea' },
    { name: 'L.A. Colors', slug: 'la-colors' },
    { name: 'L.A. Girl', slug: 'la-girl' },
  ];
  const createdBrands: Record<string, any> = {};
  for (const b of brandsData) {
    createdBrands[b.slug] = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b,
    });
  }
  console.log('Brands seeded.');

  // 4. Categories Tree
  // Root Categories
  const maquillaje = await prisma.category.upsert({
    where: { slug: 'maquillaje-y-accesorios' },
    update: {},
    create: { name: 'Maquillaje y Accesorios', slug: 'maquillaje-y-accesorios' },
  });
  const cuidado = await prisma.category.upsert({
    where: { slug: 'cuidado-facial-y-capilar' },
    update: {},
    create: { name: 'Cuidado Facial y Capilar', slug: 'cuidado-facial-y-capilar' },
  });

  // Level 1 Categories
  const makeChildren = [
    { name: 'Ojos', slug: 'ojos', parentId: maquillaje.id },
    { name: 'Labios', slug: 'labios', parentId: maquillaje.id },
    { name: 'Rostro', slug: 'rostro', parentId: maquillaje.id },
    { name: 'Brochas y Herramientas', slug: 'brochas-y-herramientas', parentId: maquillaje.id },
    { name: 'Accesorios', slug: 'accesorios', parentId: maquillaje.id },
  ];
  const cuidadoChildren = [
    { name: 'Facial por marca', slug: 'facial-por-marca', parentId: cuidado.id },
    { name: 'Capilar por marca', slug: 'capilar-por-marca', parentId: cuidado.id },
  ];

  const catMap: Record<string, any> = { maquillaje, cuidado };

  for (const c of [...makeChildren, ...cuidadoChildren]) {
    catMap[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  // Level 2 Categories
  const level2 = [
    // Ojos
    ...['Sombras', 'Delineadores', 'Pestañas', 'Pestañinas', 'Pegantes', 'Cejas', 'Correctores'].map(name => ({
      name, slug: name.toLowerCase().replace(/ñ/g, 'n').replace(/ /g, '-'), parentId: catMap['ojos'].id
    })),
    // Labios
    ...['Labiales líquidos', 'Labiales en barra', 'Lápiz de labios', 'Tintas', 'Gloss'].map(name => ({
      name, slug: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-'), parentId: catMap['labios'].id
    })),
    // Rostro
    ...['Bases', 'Polvos compactos', 'Rubores', 'Iluminadores'].map(name => ({
      name, slug: name.toLowerCase().replace(/ /g, '-'), parentId: catMap['rostro'].id
    })),
    // Brochas
    ...['Kit de brochas', 'Kit de brochas profesionales', 'Beauty Blender'].map(name => ({
      name, slug: name.toLowerCase().replace(/ /g, '-'), parentId: catMap['brochas-y-herramientas'].id
    })),
    // Accesorios
    ...['Cosmetiqueras', 'Gemas para decoración', 'Cabello', 'Billeteras', 'Otros'].map(name => ({
      name, slug: name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '-'), parentId: catMap['accesorios'].id
    })),
    // Facial
    ...['Dolce Bella', 'OG', 'Pin Up Glow', 'Kits Faciales'].map(name => ({
      name, slug: name.toLowerCase().replace(/ /g, '-'), parentId: catMap['facial-por-marca'].id
    })),
    // Capilar
    ...['Poccion', 'Milagros', 'Anyluz', 'Kaba'].map(name => ({
      name, slug: name.toLowerCase().replace(/ /g, '-'), parentId: catMap['capilar-por-marca'].id
    }))
  ];

  for (const c of level2) {
    catMap[c.slug] = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log('Categories seeded.');

  // 5. Products (5 examples)
  const products = [
    {
      name: 'Paleta de Sombras Nude',
      slug: 'paleta-sombras-nude',
      retailPrice: 45000,
      wholesalePrice: 35000,
      distributorPrice: 30000,
      categoryId: catMap['sombras'].id,
      brandId: createdBrands['dolce-bella'].id,
    },
    {
      name: 'Labial Mate Larga Duración',
      slug: 'labial-mate-larga-duracion',
      retailPrice: 15000,
      wholesalePrice: 12000,
      distributorPrice: 10000,
      categoryId: catMap['labiales-liquidos'].id,
      brandId: createdBrands['la-girl'].id,
    },
    {
      name: 'Base de Maquillaje Cobertura Total',
      slug: 'base-cobertura-total',
      retailPrice: 30000,
      wholesalePrice: 24000,
      distributorPrice: 20000,
      categoryId: catMap['bases'].id,
      brandId: createdBrands['la-colors'].id,
    },
    {
      name: 'Serum Facial Hidratante',
      slug: 'serum-facial-hidratante',
      retailPrice: 50000,
      wholesalePrice: 40000,
      distributorPrice: 35000,
      categoryId: catMap['og'].id,
      brandId: createdBrands['og'].id,
    },
    {
      name: 'Tratamiento Capilar Reparador',
      slug: 'tratamiento-capilar-reparador',
      retailPrice: 60000,
      wholesalePrice: 50000,
      distributorPrice: 45000,
      categoryId: catMap['milagros'].id,
      brandId: createdBrands['milagros'].id,
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
  }
  console.log('Products seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
