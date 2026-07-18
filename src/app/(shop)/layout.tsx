import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { categoryRepository, brandRepository } from '@/lib/repositories';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { prisma } from '@/lib/prisma';

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categoriesTree, brands, config] = await Promise.all([
    categoryRepository.getTree(),
    brandRepository.getAll(),
    prisma.siteConfig.findUnique({ where: { id: 'singleton' } })
  ]);
  
  const safeConfig = config || {
    id: 'singleton',
    wholesaleMinOrder: 200000 as any,
    distributorMinOrder: 400000 as any,
    inactivityDays: 30,
    announcementText: null,
    announcementActive: false,
    heroUseVideo: false,
    updatedAt: new Date()
  };

  const sessionResult = await getSessionResult(safeConfig);

  return (
    <>
      <Header 
        categoriesTree={categoriesTree} 
        brands={brands} 
        sessionResult={sessionResult} 
        cartItemCount={0} 
        announcementText={safeConfig.announcementText || undefined}
        announcementActive={safeConfig.announcementActive}
      />
      {children}
      <Footer />
    </>
  );
}
