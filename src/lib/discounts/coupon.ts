import { prisma } from '@/lib/prisma';
import type { PriceLevel } from '@/lib/auth/carlin-session';
import type { ResolvedLine } from '@/lib/pricing/order-lines';

/**
 * Validación y cálculo de cupones — fuente de verdad única.
 *
 * Antes esta lógica vivía dentro de `POST /api/cupones/validar` y `/api/ordenes`
 * se limitaba a creer el `couponDiscountAmount` que le mandaba el carrito. Eso
 * dejaba el importe en manos del cliente: bastaba enviar un descuento inventado
 * para rebajar el total del pedido. Ahora los dos sitios llaman aquí y el
 * cálculo se hace siempre sobre líneas ya recargadas de la base de datos
 * (`ResolvedLine`), nunca sobre precios que venga del navegador.
 */

export interface CouponResult {
  discountId: string;
  couponCode: string | null;
  label: string;
  percentage: number;
  /** Importe en pesos enteros, calculado sobre los precios de la base de datos. */
  discountAmount: number;
  applicableProductIds: string[];
}

export type CouponOutcome =
  | { ok: true; coupon: CouponResult }
  | { ok: false; error: string };

/**
 * Valida un código de cupón contra las líneas autoritativas del carrito.
 * `priceLevel` debe venir de la sesión, no del body: si no, cualquiera podría
 * reclamar un cupón restringido a mayoristas diciendo que lo es.
 */
export async function validateCoupon({
  code,
  lines,
  priceLevel,
}: {
  code: string;
  lines: ResolvedLine[];
  priceLevel: PriceLevel;
}): Promise<CouponOutcome> {
  const cleanCode = code.trim();
  if (!cleanCode) return { ok: false, error: 'Ingresa un código de cupón' };
  if (!lines.length) return { ok: false, error: 'El carrito está vacío' };

  const discount = await prisma.discount.findFirst({
    where: {
      couponCode: { equals: cleanCode, mode: 'insensitive' },
      active: true,
    },
    include: { products: true, category: true },
  });

  if (!discount) {
    return { ok: false, error: 'El código de cupón es inválido o ha sido desactivado.' };
  }

  const now = new Date();
  if (discount.startsAt && new Date(discount.startsAt) > now) {
    return { ok: false, error: 'Este cupón aún no se encuentra activo.' };
  }
  if (discount.endsAt && new Date(discount.endsAt) < now) {
    return { ok: false, error: 'Este cupón ha expirado.' };
  }

  if (discount.audience === 'WHOLESALE' && priceLevel !== 'wholesale') {
    return { ok: false, error: 'Este cupón es exclusivo para clientes mayoristas.' };
  }
  if (discount.audience === 'DISTRIBUTOR' && priceLevel !== 'distributor') {
    return { ok: false, error: 'Este cupón es exclusivo para distribuidores.' };
  }

  // Ámbito CATEGORY: la categoría indicada y todas sus subcategorías.
  let targetCategoryIds: string[] = [];
  if (discount.scope === 'CATEGORY' && discount.categoryId) {
    const subcats = await prisma.category.findMany({
      where: { parentId: discount.categoryId },
      select: { id: true },
    });
    targetCategoryIds = [discount.categoryId, ...subcats.map((c) => c.id)];
  }

  const scopedProductIds = new Set(discount.products.map((dp) => dp.productId));
  if (discount.productId) scopedProductIds.add(discount.productId);

  const percentage = Number(discount.percentage);
  const rate = percentage / 100;

  const applicableProductIds: string[] = [];
  let discountAmount = 0;

  for (const line of lines) {
    let applies = false;
    if (discount.scope === 'GLOBAL') {
      applies = true;
    } else if (discount.scope === 'CATEGORY') {
      applies = targetCategoryIds.includes(line.categoryId);
    } else if (discount.scope === 'PRODUCT') {
      applies = scopedProductIds.has(line.productId);
    }

    if (applies) {
      applicableProductIds.push(line.productId);
      // lineTotal ya viene de la base de datos, no del cliente.
      discountAmount += line.lineTotal * rate;
    }
  }

  if (!applicableProductIds.length || discountAmount <= 0) {
    return { ok: false, error: 'El cupón no aplica a ningún producto en tu carrito.' };
  }

  return {
    ok: true,
    coupon: {
      discountId: discount.id,
      couponCode: discount.couponCode,
      label: discount.label,
      percentage,
      discountAmount: Math.round(discountAmount),
      applicableProductIds,
    },
  };
}
