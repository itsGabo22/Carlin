import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carlin-web.vercel.app';

  // 1. Static Routes
  const staticRoutes = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/catalogo`, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${baseUrl}/mayoristas`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/contacto`, priority: 0.5, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/legal/privacidad`, priority: 0.3, changeFrequency: 'monthly' as const },
    { url: `${baseUrl}/legal/terminos`, priority: 0.3, changeFrequency: 'monthly' as const },
  ];

  // 2. Categories — solo activas; las ocultas no deben indexarse.
  // La URL se arma con la cadena COMPLETA de padres, así que las categorías de
  // tercer nivel (Maquillaje > Ojos > Sombras) se indexan en su ruta real.
  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { id: true, slug: true, parentId: true }
  });

  const porId = new Map(categories.map(c => [c.id, c]));

  const categoryRoutes = categories.map(cat => {
    const slugs: string[] = [];
    let cursor: typeof cat | undefined = cat;
    const vistos = new Set<string>();
    while (cursor) {
      if (vistos.has(cursor.id)) break; // guarda anti-ciclo
      vistos.add(cursor.id);
      slugs.unshift(cursor.slug);
      cursor = cursor.parentId ? porId.get(cursor.parentId) : undefined;
    }
    return {
      url: `${baseUrl}/catalogo/${slugs.join('/')}`,
      // Cuanto más profunda, algo menos de prioridad.
      priority: slugs.length === 1 ? 0.8 : slugs.length === 2 ? 0.7 : 0.6,
      changeFrequency: 'weekly' as const,
    };
  });

  // 3. Brands
  const brands = await prisma.brand.findMany();
  const brandRoutes = brands.map(brand => ({
    url: `${baseUrl}/marca/${brand.slug}`,
    priority: 0.7,
    changeFrequency: 'weekly' as const,
  }));

  // 4. Products (Active)
  const products = await prisma.product.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true }
  });
  const productRoutes = products.map(product => ({
    url: `${baseUrl}/producto/${product.slug}`,
    lastModified: product.updatedAt,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));

  return [...staticRoutes, ...categoryRoutes, ...brandRoutes, ...productRoutes];
}
