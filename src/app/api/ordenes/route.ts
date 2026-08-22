import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { getSiteConfig } from '@/lib/site-config';
import { getWelcomeDiscount } from '@/lib/discounts/welcome';
import { validateCoupon } from '@/lib/discounts/coupon';
import { resolveOrderLines, subtotalOf, OrderLineError } from '@/lib/pricing/order-lines';
import { resolveWholesaleTier, minimumNotMetMessage } from '@/lib/pricing/wholesale-tier';
import { formatCOP, computeWelcomeDiscountAmount } from '@/lib/utils/carlin-pricing';

/**
 * Del cliente sólo se aceptan QUÉ se pide y a nombre de quién.
 *
 * `price`, `subtotal`, `total` y `couponDiscountAmount` siguen admitiéndose
 * porque el carrito los envía, pero son puramente informativos: el importe se
 * recalcula entero en el servidor (ver `resolveOrderLines` y `validateCoupon`).
 * Antes se guardaban tal cual y un pedido de un producto de 45.000 podía
 * crearse con total 1 enviando `price: 1`.
 */
const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    variantId: z.string().nullable().optional(),
    colorName: z.string().nullable().optional(),
    colorHex: z.string().nullable().optional(),
    name: z.string().optional(),
    price: z.number().optional(),
    quantity: z.number().int().positive(),
    imageUrl: z.string().optional(),
  })).min(1),
  subtotal: z.number().optional(),
  couponCode: z.string().nullable().optional(),
  couponLabel: z.string().nullable().optional(),
  couponDiscountAmount: z.number().optional(),
  welcomeDiscountAmount: z.number().optional(),
  total: z.number().optional(),
  priceLevel: z.enum(['retail', 'wholesale', 'distributor']).optional(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(7),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = orderSchema.parse(body);

    const safeConfig = await getSiteConfig();

    const sessionResult = await getSessionResult(safeConfig);
    const wholesaleUserId = sessionResult.user?.id;

    // El nivel BASE lo decide la SESIÓN, no el cliente: `validated.priceLevel`
    // llega del carrito y podría venir manipulado o, como pasaba, congelado en
    // 'retail' aunque el usuario sea mayorista. Sólo puede valer 'retail' o
    // 'wholesale': el precio de distribuidor ya no lo concede la cuenta.
    const baseLevel = sessionResult.priceLevel;

    // ── Precios autoritativos ──────────────────────────────────────────
    // Se recargan los productos de la base de datos y se recalcula cada línea
    // con el precio que corresponde a este nivel. Lo que mandó el carrito en
    // `price`/`subtotal` no se usa para cobrar.
    const baseLines = await resolveOrderLines(validated.items, baseLevel);

    // ── Tramo de precio según el tamaño del pedido ─────────────────────
    // El subtotal se mide sobre las líneas ya recalculadas desde la base de
    // datos, así que ni el umbral ni el tramo se pueden forzar desde el
    // cliente: mandar `total: 1` o `priceLevel: 'distributor'` no cambia nada.
    const tier = resolveWholesaleTier({
      baseLevel,
      baseSubtotal: subtotalOf(baseLines),
      config: safeConfig,
    });

    if (!tier.meetsMinimum) {
      return NextResponse.json(
        {
          error: minimumNotMetMessage(tier, formatCOP),
          minimumRequired: tier.minimumRequired,
          missing: tier.missing,
          subtotal: tier.baseSubtotal,
        },
        { status: 400 }
      );
    }

    const priceLevel = tier.priceLevel;

    const prismaPriceLevel =
      priceLevel === 'distributor' ? 'DISTRIBUTOR' :
      priceLevel === 'wholesale' ? 'WHOLESALE' : 'RETAIL';

    // Si el pedido alcanzó el tramo de distribuidor hay que resolver las líneas
    // otra vez: las de `baseLines` llevan el precio mayorista.
    const lines = tier.escalated
      ? await resolveOrderLines(validated.items, priceLevel)
      : baseLines;
    const subtotal = subtotalOf(lines);

    // ── Cupón ──────────────────────────────────────────────────────────
    // Se revalida el código contra las líneas ya recalculadas. Si dejó de ser
    // válido entre el carrito y el envío, se avisa en lugar de cobrar de más.
    let couponDiscountAmount = 0;
    let appliedCouponCode: string | null = null;
    let appliedCouponLabel: string | null = null;
    if (validated.couponCode?.trim()) {
      const outcome = await validateCoupon({
        code: validated.couponCode,
        lines,
        priceLevel,
      });
      if (!outcome.ok) {
        return NextResponse.json({ error: outcome.error }, { status: 400 });
      }
      couponDiscountAmount = outcome.coupon.discountAmount;
      appliedCouponCode = outcome.coupon.couponCode;
      appliedCouponLabel = outcome.coupon.label;
    }

    const totalAfterCoupon = Math.max(0, subtotal - couponDiscountAmount);

    // ── Descuento de bienvenida ────────────────────────────────────────
    // Se recalcula desde la sesión y la config: lo que mande el cliente en
    // `welcomeDiscountAmount` es sólo informativo.
    const welcomeDiscount = await getWelcomeDiscount(sessionResult.user, safeConfig);
    const welcomeDiscountAmount = welcomeDiscount
      ? computeWelcomeDiscountAmount(totalAfterCoupon, welcomeDiscount.percentage)
      : 0;

    const finalTotal = Math.max(0, totalAfterCoupon - welcomeDiscountAmount);

    // 1. Crear el pedido y consumir el descuento en la MISMA transacción:
    //    si algo falla, ni se cobra el descuento ni se marca como usado.
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          total: finalTotal,
          priceLevel: prismaPriceLevel,
          status: 'PENDING_WHATSAPP',
          customerName: validated.customerName,
          customerPhone: validated.customerPhone,
          wholesaleUserId: wholesaleUserId || null,
          guestEmail: sessionResult.user?.email || null,
          welcomeDiscountPct: welcomeDiscount ? welcomeDiscount.percentage : null,
          welcomeDiscountAmount: welcomeDiscountAmount > 0 ? welcomeDiscountAmount : null,
          items: {
            create: lines.map(l => ({
              productId: l.productId,
              variantId: l.variantId,
              name: l.colorName ? `${l.productName} (${l.colorName})` : l.productName,
              priceSnapshot: l.unitPrice,
              quantity: l.quantity,
              imageUrl: l.imageUrl ?? undefined,
            }))
          }
        }
      });

      // 2. Update lastOrderAt if applicable
      if (wholesaleUserId) {
        await tx.wholesaleUser.update({
          where: { id: wholesaleUserId },
          data: {
            lastOrderAt: new Date(),
            // Quema el descuento: a partir de aquí `getWelcomeDiscount` devuelve null.
            ...(welcomeDiscountAmount > 0 ? { welcomeDiscountUsedAt: new Date() } : {}),
          }
        });
      }

      return created;
    });

    // 3. Construct WhatsApp Message
    let msg = '';
    const orderNumber = order.id.slice(-6).toUpperCase();

    if (priceLevel === 'retail') {
      msg += `¡Hola Carlin! 💄 Me gustaría hacer el siguiente pedido:\n\n`;
      msg += `📋 Pedido #${orderNumber}\n`;
    } else if (priceLevel === 'wholesale') {
      msg += `¡Hola Carlin! Soy mayorista y quiero hacer el siguiente pedido:\n\n`;
      msg += `🏷️ Pedido MAYORISTA #${orderNumber}\n`;
    } else {
      // El tramo se ganó por el TAMAÑO del pedido, no por ser "distribuidor":
      // el mensaje lo dice así para que la tienda entienda de dónde sale.
      msg += `¡Hola Carlin! Soy mayorista y quiero hacer el siguiente pedido:\n\n`;
      msg += `⭐ Pedido MAYORISTA #${orderNumber} — PRECIO DISTRIBUIDOR\n`;
      msg += `(pedido desde ${formatCOP(tier.escalationThreshold)})\n`;
    }

    lines.forEach(l => {
      const colorLabel = l.colorName ? ` (Color: ${l.colorName})` : '';
      msg += `• ${l.productName}${colorLabel} x${l.quantity} = ${formatCOP(l.lineTotal)}\n`;
    });

    msg += `─────────────────────\n`;

    // El subtotal se muestra si hubo cualquier descuento, para que se entienda
    // de dónde sale el total final.
    if (couponDiscountAmount > 0 || welcomeDiscountAmount > 0) {
      msg += `Subtotal: ${formatCOP(subtotal)}\n`;
    }

    if (couponDiscountAmount > 0 && appliedCouponCode) {
      msg += `🏷️ Cupón aplicado (${appliedCouponCode}${appliedCouponLabel ? ` - ${appliedCouponLabel}` : ''}): -${formatCOP(couponDiscountAmount)}\n`;
    }

    if (welcomeDiscountAmount > 0 && welcomeDiscount) {
      msg += `🎁 Descuento de bienvenida (${welcomeDiscount.percentage}% primera compra): -${formatCOP(welcomeDiscountAmount)}\n`;
    }

    if (priceLevel === 'retail') {
      msg += `💰 Total: ${formatCOP(finalTotal)}\n\n`;
    } else if (priceLevel === 'wholesale') {
      msg += `💰 Total mayorista: ${formatCOP(finalTotal)}\n\n`;
    } else {
      msg += `💰 Total con precio distribuidor: ${formatCOP(finalTotal)}\n`;
      // Deja constancia de por qué el total es menor que el subtotal que el
      // cliente vio en el catálogo (allí los precios son los de mayorista).
      msg += `   (a precio mayorista habría sido ${formatCOP(tier.baseSubtotal)})\n\n`;
    }

    msg += `📞 Mis datos:\n`;
    msg += `Nombre: ${validated.customerName}\n`;
    msg += `Teléfono: ${validated.customerPhone}`;

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573000000000';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;

    return NextResponse.json({ orderId: order.id, whatsappUrl, total: finalTotal });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: error.issues }, { status: 400 });
    }
    if (error instanceof OrderLineError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Error interno al procesar el pedido' }, { status: 500 });
  }
}
