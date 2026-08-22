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

  // Toda cuenta mayorista aprobada y activa tiene el MISMO nivel base.
  //
  // Antes se ramificaba aquí por `wholesaleUser.role`: MAYORISTA → 'wholesale'
  // y DISTRIBUIDOR → 'distributor'. Ya no: "Distribuidor" dejó de ser un tipo
  // de cuenta y el precio de distribuidor se gana por tamaño de pedido, no por
  // registro (ver `resolveWholesaleTier`). El campo `role` se conserva en la
  // base de datos por historia, pero NO decide ningún precio.
  //
  // El escalado a 'distributor' no puede vivir en la sesión porque depende del
  // carrito, que la sesión no conoce: lo resuelve el servidor al cotizar el
  // carrito y al crear el pedido.
  return {
    user: wholesaleUser,
    priceLevel: 'wholesale',
    isActive: true,
    isPending: false,
    welcomeDiscount,
    showWelcomePanel,
  };
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
