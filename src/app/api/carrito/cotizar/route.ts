import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { getSiteConfig } from '@/lib/site-config';
import { getWelcomeDiscount } from '@/lib/discounts/welcome';
import { validateCoupon } from '@/lib/discounts/coupon';
import { resolveOrderLines, subtotalOf, OrderLineError } from '@/lib/pricing/order-lines';
import { resolveWholesaleTier, minimumNotMetMessage } from '@/lib/pricing/wholesale-tier';
import { formatCOP, computeWelcomeDiscountAmount } from '@/lib/utils/carlin-pricing';

/**
 * Cotiza el carrito actual en el servidor.
 *
 * ¿Por qué hace falta? El carrito vive en localStorage y guarda el precio
 * CONGELADO en el momento de añadir cada producto, que es el del catálogo
 * (siempre precio mayorista). Desde que el tramo de distribuidor se gana por
 * tamaño de pedido, ese precio congelado deja de ser el que se va a cobrar en
 * cuanto el carrito pasa de `distributorMinOrder`: el carrito mostraría
 * 420.000 y el pedido acabaría en 360.000.
 *
 * En lugar de reimplementar la regla en el cliente (que no es de fiar para
 * dinero, y se desincronizaría), el carrito pregunta aquí y pinta lo que
 * responda el servidor. Se usan EXACTAMENTE las mismas funciones que
 * `/api/ordenes`, así que la vista previa y el cobro no pueden divergir.
 *
 * Del cliente sólo se acepta QUÉ hay en el carrito. No crea nada.
 */

const requestSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().nullable().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, 'El carrito está vacío'),
  /** Cupón ya aplicado en el carrito, para cotizar el total definitivo. */
  couponCode: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: first?.message || 'Datos inválidos' }, { status: 400 });
    }

    const config = await getSiteConfig();
    const session = await getSessionResult(config);

    const baseLines = await resolveOrderLines(parsed.data.items, session.priceLevel);
    const tier = resolveWholesaleTier({
      baseLevel: session.priceLevel,
      baseSubtotal: subtotalOf(baseLines),
      config,
    });

    const lines = tier.escalated
      ? await resolveOrderLines(parsed.data.items, tier.priceLevel)
      : baseLines;
    const subtotal = subtotalOf(lines);

    // ── Cupón ──────────────────────────────────────────────────────────
    // Se revalida contra las líneas ya escaladas. Si dejó de ser válido (p. ej.
    // se quitó el producto al que aplicaba), se avisa sin romper la cotización:
    // el carrito lo muestra y el pedido volverá a decir lo mismo.
    let couponDiscountAmount = 0;
    let couponError: string | null = null;
    if (parsed.data.couponCode?.trim()) {
      const outcome = await validateCoupon({
        code: parsed.data.couponCode,
        lines,
        priceLevel: tier.priceLevel,
      });
      if (outcome.ok) {
        couponDiscountAmount = outcome.coupon.discountAmount;
      } else {
        couponError = outcome.error;
      }
    }

    const totalAfterCoupon = Math.max(0, subtotal - couponDiscountAmount);

    // El descuento de bienvenida cae sobre el total YA rebajado por el cupón:
    // mismo orden que en /api/ordenes, para que los dos importes coincidan.
    const welcomeDiscount = await getWelcomeDiscount(session.user, config);
    const welcomeDiscountAmount = welcomeDiscount
      ? computeWelcomeDiscountAmount(totalAfterCoupon, welcomeDiscount.percentage)
      : 0;

    return NextResponse.json({
      priceLevel: tier.priceLevel,
      baseLevel: tier.baseLevel,
      escalated: tier.escalated,
      subtotal,
      /** Subtotal a precio mayorista: la referencia de los dos umbrales. */
      baseSubtotal: tier.baseSubtotal,
      meetsMinimum: tier.meetsMinimum,
      minimumRequired: tier.minimumRequired,
      missing: tier.missing,
      escalationThreshold: tier.escalationThreshold,
      missingForEscalation: tier.missingForEscalation,
      /** Mensaje ya redactado para el caso "no llega al mínimo". */
      minimumMessage: tier.meetsMinimum ? null : minimumNotMetMessage(tier, formatCOP),
      couponDiscountAmount,
      couponError,
      welcomeDiscountPercentage: welcomeDiscount?.percentage ?? null,
      welcomeDiscountAmount,
      /** Total definitivo: es el mismo que cobrará /api/ordenes. */
      total: Math.max(0, totalAfterCoupon - welcomeDiscountAmount),
      lines: lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        name: l.colorName ? `${l.productName} (${l.colorName})` : l.productName,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
      })),
    });
  } catch (error) {
    if (error instanceof OrderLineError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[CARRITO COTIZAR ERROR]', error);
    return NextResponse.json({ error: 'Error interno al cotizar el carrito.' }, { status: 500 });
  }
}
