import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { getSiteConfig } from '@/lib/site-config';
import { getWelcomeDiscount } from '@/lib/discounts/welcome';
import { formatCOP, computeWelcomeDiscountAmount } from '@/lib/utils/carlin-pricing';

const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().nullable().optional(),
    colorName: z.string().nullable().optional(),
    colorHex: z.string().nullable().optional(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().int().positive(),
    imageUrl: z.string().optional(),
  })).min(1),
  subtotal: z.number().optional(),
  couponCode: z.string().nullable().optional(),
  couponLabel: z.string().nullable().optional(),
  couponDiscountAmount: z.number().optional(),
  welcomeDiscountAmount: z.number().optional(),
  total: z.number().positive(),
  priceLevel: z.enum(['retail', 'wholesale', 'distributor']),
  customerName: z.string().min(2),
  customerPhone: z.string().min(7),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = orderSchema.parse(body);

    // Get session to securely determine if this is a wholesale/distributor user
    const safeConfig = await getSiteConfig();

    const sessionResult = await getSessionResult(safeConfig);
    const wholesaleUserId = sessionResult.user?.id;

    // Determine the Prisma enum value for priceLevel
    const prismaPriceLevel =
      validated.priceLevel === 'distributor' ? 'DISTRIBUTOR' :
      validated.priceLevel === 'wholesale' ? 'WHOLESALE' : 'RETAIL';

    // ── Descuento de bienvenida ────────────────────────────────────────
    // Se recalcula aquí desde la sesión y la config: lo que mande el cliente
    // en `welcomeDiscountAmount` es sólo informativo. Si no califica, no se
    // aplica por más que el carrito lo pida.
    const subtotal = validated.subtotal ?? validated.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const couponDiscountAmount = validated.couponDiscountAmount ?? 0;
    const totalAfterCoupon = Math.max(0, subtotal - couponDiscountAmount);

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
            create: validated.items.map(i => ({
              productId: i.productId,
              variantId: i.variantId || null,
              name: i.colorName ? `${i.name} (${i.colorName})` : i.name,
              priceSnapshot: i.price,
              quantity: i.quantity,
              imageUrl: i.imageUrl,
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

    if (validated.priceLevel === 'retail') {
      msg += `¡Hola Carlin! 💄 Me gustaría hacer el siguiente pedido:\n\n`;
      msg += `📋 Pedido #${orderNumber}\n`;
    } else if (validated.priceLevel === 'wholesale') {
      msg += `¡Hola Carlin! Soy mayorista y quiero hacer el siguiente pedido:\n\n`;
      msg += `🏷️ Pedido MAYORISTA #${orderNumber}\n`;
    } else {
      msg += `¡Hola Carlin! Soy distribuidor y quiero hacer el siguiente pedido:\n\n`;
      msg += `⭐ Pedido DISTRIBUIDOR #${orderNumber}\n`;
    }
    
    validated.items.forEach(item => {
      const colorLabel = item.colorName ? ` (Color: ${item.colorName})` : '';
      msg += `• ${item.name}${colorLabel} x${item.quantity} = ${formatCOP(item.price * item.quantity)}\n`;
    });
    
    msg += `─────────────────────\n`;

    // El subtotal se muestra si hubo cualquier descuento, para que se entienda
    // de dónde sale el total final.
    if (couponDiscountAmount > 0 || welcomeDiscountAmount > 0) {
      msg += `Subtotal: ${formatCOP(subtotal)}\n`;
    }

    if (couponDiscountAmount > 0 && validated.couponCode) {
      msg += `🏷️ Cupón aplicado (${validated.couponCode}${validated.couponLabel ? ` - ${validated.couponLabel}` : ''}): -${formatCOP(couponDiscountAmount)}\n`;
    }

    if (welcomeDiscountAmount > 0 && welcomeDiscount) {
      msg += `🎁 Descuento de bienvenida (${welcomeDiscount.percentage}% primera compra): -${formatCOP(welcomeDiscountAmount)}\n`;
    }

    if (validated.priceLevel === 'retail') {
      msg += `💰 Total: ${formatCOP(finalTotal)}\n\n`;
    } else if (validated.priceLevel === 'wholesale') {
      msg += `💰 Total mayorista: ${formatCOP(finalTotal)}\n\n`;
    } else {
      msg += `💰 Total distribuidor: ${formatCOP(finalTotal)}\n\n`;
    }

    msg += `📞 Mis datos:\n`;
    msg += `Nombre: ${validated.customerName}\n`;
    msg += `Teléfono: ${validated.customerPhone}`;

    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '573000000000';
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;

    return NextResponse.json({ orderId: order.id, whatsappUrl });
    
  } catch (error: any) {
    console.error('Order creation error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos inválidos', details: (error as any).errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Error interno al procesar el pedido' }, { status: 500 });
  }
}
