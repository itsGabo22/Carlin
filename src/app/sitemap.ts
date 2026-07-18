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

  // 2. Categories
  const categories = await prisma.category.findMany({
    include: { children: true }
  });
  
  const categoryRoutes = categories.flatMap(cat => {
    const routes = [];
    if (!cat.parentId) {
      // Root category
      routes.push({
        url: `${baseUrl}/catalogo/${cat.slug}`,
        priority: 0.8,
        changeFrequency: 'weekly' as const,
      });
    } else {
      // Subcategory
      const parent = categories.find(p => p.id === cat.parentId);
      if (parent) {
        routes.push({
          url: `${baseUrl}/catalogo/${parent.slug}/${cat.slug}`,
          priority: 0.7,
          changeFrequency: 'weekly' as const,
        });
      }
    }
    return routes;
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
