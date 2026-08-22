import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { ScrollToTopButton } from '@/components/layout/ScrollToTopButton';
import { categoryRepository, brandRepository } from '@/lib/repositories';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { prisma } from '@/lib/prisma';
import { SessionSetter } from '@/components/layout/SessionSetter';
import { WelcomePanel } from '@/components/mayoristas/WelcomePanel';
import { getSiteConfig } from '@/lib/site-config';

import { LazyMotion, domAnimation } from 'framer-motion';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categoriesTree, brands, safeConfig, marquees] = await Promise.all([
    categoryRepository.getTree(),
    brandRepository.getAll(),
    getSiteConfig(),
    prisma.marqueeMessage.findMany({ where: { active: true }, orderBy: { order: 'asc' } })
  ]);

  const sessionResult = await getSessionResult(safeConfig);

  const showWelcomePanel = sessionResult.isActive && sessionResult.showWelcomePanel;

  return (
    <>
      <SessionSetter
        priceLevel={sessionResult.priceLevel}
        userName={sessionResult.user?.name || sessionResult.user?.email || null}
        welcomeDiscountPercentage={sessionResult.welcomeDiscount?.percentage ?? null}
      />

      {showWelcomePanel && (
        <WelcomePanel
          name={sessionResult.user?.name ?? null}
          minOrder={Number(safeConfig.wholesaleMinOrder)}
          distributorThreshold={Number(safeConfig.distributorMinOrder)}
          welcomeDiscountPercentage={sessionResult.welcomeDiscount?.percentage ?? null}
          title={safeConfig.welcomeTitle}
          message={safeConfig.welcomeMessage}
          imageUrl={safeConfig.welcomeImageUrl}
        />
      )}
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
