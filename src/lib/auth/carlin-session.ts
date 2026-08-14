import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isWholesaleActive } from '@/lib/utils/carlin-pricing';
import { getWelcomeDiscount, type WelcomeDiscount } from '@/lib/discounts/welcome';
import { redirect } from 'next/navigation';
import type { WholesaleUser, SiteConfig } from '@prisma/client';

export type PriceLevel = 'retail' | 'wholesale' | 'distributor';

export interface SessionResult {
  user: WholesaleUser | null;
  priceLevel: PriceLevel;
  isActive: boolean;
  isPending: boolean;
  /** Descuento de primera compra vigente, o `null` si esta cuenta no califica. */
  welcomeDiscount: WelcomeDiscount | null;
  /** `true` la primera vez que entra tras ser aprobado (panel de bienvenida). */
  showWelcomePanel: boolean;
}

const ANONYMOUS: SessionResult = {
  user: null,
  priceLevel: 'retail',
  isActive: false,
  isPending: false,
  welcomeDiscount: null,
  showWelcomePanel: false,
};

export async function getSessionResult(config: SiteConfig): Promise<SessionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return ANONYMOUS;

  const wholesaleUser = await prisma.wholesaleUser.findUnique({
    where: { authId: user.id }
  });

  if (!wholesaleUser) return ANONYMOUS;

  if (!wholesaleUser.approved) {
    return { ...ANONYMOUS, user: wholesaleUser, isPending: true };
  }

  // Sin `lastOrderAt` la cuenta se mide desde su aprobación (ver isWholesaleActive).
  const isActiveWholesale = isWholesaleActive(
    wholesaleUser.lastOrderAt,
    config.inactivityDays,
    wholesaleUser.approvedAt ?? wholesaleUser.createdAt
  );

  if (!isActiveWholesale) {
    return { ...ANONYMOUS, user: wholesaleUser };
  }

  const welcomeDiscount = await getWelcomeDiscount(wholesaleUser, config);
  const showWelcomePanel = !wholesaleUser.welcomeSeenAt;

  if (wholesaleUser.role === 'DISTRIBUIDOR') {
    return {
      user: wholesaleUser, priceLevel: 'distributor', isActive: true, isPending: false,
      welcomeDiscount, showWelcomePanel,
    };
  }

  if (wholesaleUser.role === 'MAYORISTA') {
    return {
      user: wholesaleUser, priceLevel: 'wholesale', isActive: true, isPending: false,
      welcomeDiscount, showWelcomePanel,
    };
  }

  return { ...ANONYMOUS, user: wholesaleUser };
}

export async function requireWholesaleAuth(): Promise<WholesaleUser> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/mayoristas/login');
  }

  const wholesaleUser = await prisma.wholesaleUser.findUnique({
    where: { authId: user.id }
  });

  if (!wholesaleUser) {
    redirect('/mayoristas/login');
  }

  if (!wholesaleUser.approved) {
    redirect('/mayoristas/pendiente');
  }

  return wholesaleUser;
}
