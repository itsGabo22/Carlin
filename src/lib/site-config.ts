import { prisma } from '@/lib/prisma';
import type { SiteConfig } from '@prisma/client';

/**
 * Config del sitio con valores por defecto si la fila `singleton` no existe.
 *
 * Estaba duplicada literalmente en los layouts de (shop) y (marketing) y en
 * /api/ordenes: cada campo nuevo de SiteConfig había que acordarse de añadirlo
 * en los tres sitios o el default se quedaba corto en silencio.
 */
export const DEFAULT_SITE_CONFIG: SiteConfig = {
  id: 'singleton',
  wholesaleMinOrder: 200000 as any,
  distributorMinOrder: 400000 as any,
  inactivityDays: 30,
  welcomeDiscountActive: false,
  welcomeDiscountPercentage: 0 as any,
  announcementText: null,
  announcementActive: false,
  heroUseVideo: false,
  catalogMaquillajeUrl: null,
  catalogCapilarUrl: null,
  updatedAt: new Date(),
};

export async function getSiteConfig(): Promise<SiteConfig> {
  const config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } });
  return config ?? DEFAULT_SITE_CONFIG;
}
