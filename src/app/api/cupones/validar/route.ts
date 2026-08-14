import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, items, priceLevel } = body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Ingresa un código de cupón' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    const cleanCode = code.trim();

    // Find discount by couponCode (case-insensitive)
    const discount = await prisma.discount.findFirst({
      where: {
        couponCode: { equals: cleanCode, mode: 'insensitive' },
        active: true,
      },
      include: {
        products: true,
        category: true,
      },
    });

    if (!discount) {
      return NextResponse.json({ error: 'El código de cupón es inválido o ha sido desactivado.' }, { status: 400 });
    }

    // Check validity dates
    const now = new Date();
    if (discount.startsAt && new Date(discount.startsAt) > now) {
      return NextResponse.json({ error: 'Este cupón aún no se encuentra activo.' }, { status: 400 });
    }
    if (discount.endsAt && new Date(discount.endsAt) < now) {
      return NextResponse.json({ error: 'Este cupón ha expirado.' }, { status: 400 });
    }

    // Check audience
    if (discount.audience === 'WHOLESALE' && priceLevel !== 'wholesale') {
      return NextResponse.json({ error: 'Este cupón es exclusivo para clientes mayoristas.' }, { status: 400 });
    }
    if (discount.audience === 'DISTRIBUTOR' && priceLevel !== 'distributor') {
      return NextResponse.json({ error: 'Este cupón es exclusivo para distribuidores.' }, { status: 400 });
    }

    // Determine target products for scope matching
    const itemProductIds = items.map((i: any) => i.productId);
    const cartProducts = await prisma.product.findMany({
      where: { id: { in: itemProductIds } },
      select: { id: true, categoryId: true },
    });
    const productCategoryMap = new Map(cartProducts.map((p) => [p.id, p.categoryId]));

    // If category scope, collect category and all subcategories
    let targetCategoryIds: string[] = [];
    if (discount.scope === 'CATEGORY' && discount.categoryId) {
      targetCategoryIds.push(discount.categoryId);
      const subcats = await prisma.category.findMany({
        where: { parentId: discount.categoryId },
        select: { id: true },
      });
      targetCategoryIds.push(...subcats.map((c) => c.id));
    }

    // Find applicable product IDs in cart
    const m2mProductIds = new Set(discount.products.map((dp) => dp.productId));
    if (discount.productId) m2mProductIds.add(discount.productId);

    const applicableProductIds: string[] = [];
    let totalDiscountAmount = 0;

    const percentage = Number(discount.percentage) / 100;

    for (const item of items) {
      let applies = false;

      if (discount.scope === 'GLOBAL') {
        applies = true;
      } else if (discount.scope === 'CATEGORY') {
        const itemCatId = productCategoryMap.get(item.productId);
        if (itemCatId && targetCategoryIds.includes(itemCatId)) {
          applies = true;
        }
      } else if (discount.scope === 'PRODUCT') {
        if (m2mProductIds.has(item.productId)) {
          applies = true;
        }
      }

      if (applies) {
        applicableProductIds.push(item.productId);
        const itemSavings = (item.price * percentage) * item.quantity;
        totalDiscountAmount += itemSavings;
      }
    }

    if (applicableProductIds.length === 0 || totalDiscountAmount <= 0) {
      return NextResponse.json({ error: 'El cupón no aplica a ningún producto en tu carrito.' }, { status: 400 });
    }

    return NextResponse.json({
      valid: true,
      discountId: discount.id,
      couponCode: discount.couponCode,
      label: discount.label,
      percentage: Number(discount.percentage),
      discountAmount: Math.round(totalDiscountAmount),
      applicableProductIds,
    });
  } catch (error: any) {
    console.error('[CUPON VALIDAR ERROR]', error);
    return NextResponse.json({ error: 'Error interno al validar el cupón.' }, { status: 500 });
  }
}
