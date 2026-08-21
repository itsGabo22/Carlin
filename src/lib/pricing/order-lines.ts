import { prisma } from '@/lib/prisma';
import { getEffectivePrice } from '@/lib/utils/carlin-pricing';
import type { PriceLevel } from '@/lib/auth/carlin-session';
import type { Role } from '@prisma/client';

/**
 * Precio autoritativo de las líneas de un pedido.
 *
 * REGLA: el precio de un pedido NUNCA sale del cliente. El carrito vive en
 * localStorage y todo lo que envía (`price`, `subtotal`, `total`,
 * `couponDiscountAmount`) es manipulable con un simple fetch. Antes se
 * guardaba tal cual, así que se podía crear un pedido de un producto de
 * 45.000 declarando `price: 1` y quedaba en la base de datos con total 1.
 *
 * Aquí se recargan los productos desde la base de datos y se recalcula el
 * precio unitario según el `priceLevel` que decide la SESIÓN, no el cliente.
 * Es el mismo `getEffectivePrice` que usa el catálogo para pintar el precio,
 * así que el importe autoritativo coincide con lo que el cliente vio.
 *
 * Además se comprueba aquí que el producto (y la variante) estén activos:
 * Prisma entra por conexión directa como owner y NO aplica RLS, así que el
 * filtro `active` tiene que existir en el código de la aplicación.
 */

const ROLE_BY_LEVEL: Record<PriceLevel, Role | null> = {
  retail: null,
  wholesale: 'MAYORISTA',
  distributor: 'DISTRIBUIDOR',
};

/** Error con mensaje pensado para mostrarse al cliente (→ 400). */
export class OrderLineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderLineError';
  }
}

export interface RequestedItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface ResolvedLine {
  productId: string;
  variantId: string | null;
  /** Nombre del producto en la base de datos (no el que mandó el cliente). */
  productName: string;
  /** Nombre de la variante, si la línea tiene una. */
  colorName: string | null;
  colorHex: string | null;
  imageUrl: string | null;
  categoryId: string;
  /** Precio unitario recalculado desde la base de datos. */
  unitPrice: number;
  quantity: number;
  /** `unitPrice * quantity`. */
  lineTotal: number;
}

/**
 * Recarga cada línea desde la base de datos y devuelve su precio autoritativo.
 * Lanza `OrderLineError` si un producto no existe, está inactivo, o la variante
 * no pertenece al producto / está inactiva.
 */
export async function resolveOrderLines(
  items: RequestedItem[],
  priceLevel: PriceLevel
): Promise<ResolvedLine[]> {
  if (!items.length) throw new OrderLineError('El carrito está vacío');

  const role = ROLE_BY_LEVEL[priceLevel];
  const productIds = [...new Set(items.map((i) => i.productId))];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
    include: { variants: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) {
      throw new OrderLineError(
        'Uno de los productos de tu carrito ya no está disponible. Actualiza el carrito e inténtalo de nuevo.'
      );
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new OrderLineError(`Cantidad inválida para "${product.name}".`);
    }

    let variant = null;
    if (item.variantId) {
      variant = product.variants.find((v) => v.id === item.variantId && v.active) ?? null;
      if (!variant) {
        throw new OrderLineError(
          `El color seleccionado de "${product.name}" ya no está disponible.`
        );
      }
    }

    // Las variantes no tienen precio propio: heredan el del producto.
    const unitPrice = Number(getEffectivePrice(product, role));
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new OrderLineError(`No se pudo determinar el precio de "${product.name}".`);
    }

    return {
      productId: product.id,
      variantId: variant?.id ?? null,
      productName: product.name,
      colorName: variant?.colorName ?? null,
      colorHex: variant?.colorHex ?? null,
      imageUrl: variant?.imageUrl ?? product.imageUrls[0] ?? null,
      categoryId: product.categoryId,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
    };
  });
}

/** Subtotal autoritativo (suma de las líneas ya recalculadas). */
export function subtotalOf(lines: ResolvedLine[]): number {
  return lines.reduce((acc, l) => acc + l.lineTotal, 0);
}
