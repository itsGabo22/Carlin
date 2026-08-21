import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { getSiteConfig } from '@/lib/site-config';
import { validateCoupon } from '@/lib/discounts/coupon';
import { resolveOrderLines, OrderLineError } from '@/lib/pricing/order-lines';

/**
 * Previsualiza un cupón para el carrito actual.
 *
 * El importe se calcula con los precios de la base de datos y con el
 * `priceLevel` de la SESIÓN: antes se usaban el precio y el nivel que mandaba
 * el cliente, así que se podía previsualizar un cupón de mayorista desde una
 * sesión de detal, o inflar el descuento inventando precios. El pedido real
 * (`/api/ordenes`) vuelve a calcularlo por su cuenta con la misma función, así
 * que esto es sólo la vista previa.
 */

const requestSchema = z.object({
  code: z.string().min(1, 'Ingresa un código de cupón'),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().nullable().optional(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1, 'El carrito está vacío'),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json(
        { error: first?.message || 'Datos inválidos' },
        { status: 400 }
      );
    }

    const config = await getSiteConfig();
    const session = await getSessionResult(config);

    const lines = await resolveOrderLines(parsed.data.items, session.priceLevel);
    const outcome = await validateCoupon({
      code: parsed.data.code,
      lines,
      priceLevel: session.priceLevel,
    });

    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: 400 });
    }

    return NextResponse.json({ valid: true, ...outcome.coupon });
  } catch (error) {
    if (error instanceof OrderLineError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[CUPON VALIDAR ERROR]', error);
    return NextResponse.json({ error: 'Error interno al validar el cupón.' }, { status: 500 });
  }
}
