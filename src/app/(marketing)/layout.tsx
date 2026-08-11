import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { ScrollToTopButton } from '@/components/layout/ScrollToTopButton';
import { categoryRepository, brandRepository } from '@/lib/repositories';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { prisma } from '@/lib/prisma';
import { SessionSetter } from '@/components/layout/SessionSetter';

import { LazyMotion, domAnimation } from 'framer-motion';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categoriesTree, brands, config, marquees] = await Promise.all([
    categoryRepository.getTree(),
    brandRepository.getAll(),
    prisma.siteConfig.findUnique({ where: { id: 'singleton' } }),
    prisma.marqueeMessage.findMany({ where: { active: true }, orderBy: { order: 'asc' } })
  ]);

  const safeConfig = config || {
    id: 'singleton',
    wholesaleMinOrder: 200000 as any,
    distributorMinOrder: 400000 as any,
    inactivityDays: 30,
    announcementText: null,
    announcementActive: false,
    heroUseVideo: false,
    catalogMaquillajeUrl: null,
    catalogCapilarUrl: null,
    updatedAt: new Date()
  };

  const sessionResult = await getSessionResult(safeConfig);

  return (
    <>
      <SessionSetter
        priceLevel={sessionResult.priceLevel}
        userName={sessionResult.user?.name || sessionResult.user?.email || null}
      />
      <Header
        categoriesTree={categoriesTree}
        brands={brands}
        sessionResult={sessionResult}
        cartItemCount={0}
        announcementText={safeConfig.announcementText || undefined}
        announcementActive={safeConfig.announcementActive}
        marquees={marquees.map(m => m.message)}
        catalogMaquillajeUrl={safeConfig.catalogMaquillajeUrl || undefined}
        catalogCapilarUrl={safeConfig.catalogCapilarUrl || undefined}
      />
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
      <Footer />
      <ScrollToTopButton />
      <WhatsAppButton />
    </>
  );
}
