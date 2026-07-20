import { prisma } from '@/lib/prisma';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isWholesaleActive } from '@/lib/utils/carlin-pricing';
import { redirect } from 'next/navigation';
import type { WholesaleUser, SiteConfig } from '@prisma/client';

export type PriceLevel = 'retail' | 'wholesale' | 'distributor';

export interface SessionResult {
  user: WholesaleUser | null;
  priceLevel: PriceLevel;
  isActive: boolean;
  isPending: boolean;
}

export async function getSessionResult(config: SiteConfig): Promise<SessionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, priceLevel: 'retail', isActive: false, isPending: false };
  }

  const wholesaleUser = await prisma.wholesaleUser.findUnique({
    where: { authId: user.id }
  });

  if (!wholesaleUser) {
    return { user: null, priceLevel: 'retail', isActive: false, isPending: false };
  }

  if (!wholesaleUser.approved) {
    return { user: wholesaleUser, priceLevel: 'retail', isActive: false, isPending: true };
  }

  const isActiveWholesale = isWholesaleActive(wholesaleUser.lastOrderAt, config.inactivityDays);

  if (!isActiveWholesale) {
    return { user: wholesaleUser, priceLevel: 'retail', isActive: false, isPending: false };
  }

  if (wholesaleUser.role === 'DISTRIBUIDOR') {
    return { user: wholesaleUser, priceLevel: 'distributor', isActive: true, isPending: false };
  }

  if (wholesaleUser.role === 'MAYORISTA') {
    return { user: wholesaleUser, priceLevel: 'wholesale', isActive: true, isPending: false };
  }

  return { user: wholesaleUser, priceLevel: 'retail', isActive: false, isPending: false };
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
