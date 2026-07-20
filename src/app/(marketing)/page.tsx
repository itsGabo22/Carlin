import { HeroSection } from '@/components/marketing/HeroSection';
import { CategoryBar } from '@/components/marketing/CategoryBar';
import { NovedadesSection } from '@/components/marketing/NovedadesSection';
import { MasVendidosSection } from '@/components/marketing/MasVendidosSection';
import { MarcasSection } from '@/components/marketing/MarcasSection';
import { WholesaleBanner } from '@/components/marketing/WholesaleBanner';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';
import { getSessionResult } from '@/lib/auth/carlin-session';

export const metadata: Metadata = {
  title: 'Carlin Cosméticos | Catálogo Mayorista de Belleza',
  description: 'Descubre el catálogo más completo de maquillaje, cuidado facial y accesorios. Únete a nuestra red de mayoristas.',
};

export default async function HomePage() {
  // Fetch required data in parallel
  const [config, categories, brands, latestProducts, popularProducts] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { id: 'singleton' } }),
    prisma.category.findMany({
      where: { parentId: null },
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' }
    }),
    prisma.brand.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.product.findMany({
      where: { active: true },
      include: { brand: true, category: true, tags: { include: { tag: true } }, discounts: true },
      orderBy: { createdAt: 'desc' },
      take: 8
    }),
    prisma.product.findMany({
      where: { active: true, tags: { some: { tag: { name: 'Top' } } } },
      include: { brand: true, category: true, tags: { include: { tag: true } }, discounts: true },
      take: 4
    })
  ]);

  const sessionResult = await getSessionResult(config!);

  const mapProduct = (p: any) => ({
    ...p,
    retailPrice: Number(p.retailPrice),
    wholesalePrice: Number(p.wholesalePrice),
    distributorPrice: Number(p.distributorPrice),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    tags: p.tags?.map((t: any) => t.tag) || [],
    discounts: p.discounts?.map((d: any) => ({ ...d, percentage: Number(d.percentage) })) || [],
  });

  const formattedLatestProducts = latestProducts.map(mapProduct);
  const formattedPopularProducts = popularProducts.map(mapProduct);

  // If no popular products labeled 'Top', just grab random 4
  const finalPopular = formattedPopularProducts.length > 0 ? formattedPopularProducts : formattedLatestProducts.slice(0, 4);

  return (
    <main className="overflow-hidden">
      <HeroSection useVideo={config?.heroUseVideo ?? false} />
      <CategoryBar categories={categories as any} />
      <NovedadesSection products={formattedLatestProducts} priceLevel={sessionResult.priceLevel} />
      <WholesaleBanner />
      <MasVendidosSection products={finalPopular} priceLevel={sessionResult.priceLevel} />
      <MarcasSection brands={brands as any} />
    </main>
  );
}
