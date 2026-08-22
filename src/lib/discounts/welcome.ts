import { prisma } from '@/lib/prisma';
import type { SiteConfig, WholesaleUser } from '@prisma/client';

/**
 * Descuento de bienvenida de primera compra.
 *
 * Es un mecanismo aparte del modelo `Discount`/cupones: aquél es
 * "automático para ciertos productos" o "requiere escribir un código", y no
 * sabe nada de la historia de pedidos de una cuenta. Éste es por cuenta y de
 * un solo uso, así que vive en `SiteConfig` (porcentaje, editable desde
 * /admin/configuracion) + dos sellos en `WholesaleUser`.
 *
 * Los dos descuentos SÍ se acumulan: el cupón se calcula primero sobre sus
 * productos aplicables y el porcentaje de bienvenida cae después sobre el
 * total ya rebajado.
 */

export interface WelcomeDiscount {
  percentage: number;
}

/**
 * Elegibilidad: CUALQUIER cuenta mayorista aprobada.
 *
 * Antes se exigía `role === 'MAYORISTA'` para excluir a los distribuidores.
 * Esa exclusión perdió sentido cuando "Distribuidor" dejó de ser un tipo de
 * cuenta: hoy sólo hay un tier mayorista y el precio de distribuidor se gana
 * por tamaño de pedido (ver `resolveWholesaleTier`), así que filtrar por
 * `role` dejaría fuera a cuentas idénticas al resto sólo por el valor legado
 * que tengan guardado. Al hacer el cambio no había ninguna cuenta real con
 * `role = DISTRIBUIDOR`, así que esto no altera la elegibilidad de nadie.
 *
 * Los candados que de verdad importan siguen intactos: `approved`, el sello
 * `welcomeDiscountUsedAt` y "cero pedidos previos".
 *
 * Devuelve el descuento vigente para este usuario, o `null` si no califica. Es
 * la ÚNICA fuente de verdad: la usan por igual el layout (para pintar el
 * carrito y el panel de bienvenida) y `/api/ordenes` (para cobrar).
 */
export async function getWelcomeDiscount(
  user: Pick<WholesaleUser, 'id' | 'approved' | 'welcomeDiscountUsedAt'> | null,
  config: Pick<SiteConfig, 'welcomeDiscountActive' | 'welcomeDiscountPercentage'>
): Promise<WelcomeDiscount | null> {
  if (!user || !user.approved) return null;
  if (user.welcomeDiscountUsedAt) return null;
  if (!config.welcomeDiscountActive) return null;

  const percentage = Number(config.welcomeDiscountPercentage);
  if (!(percentage > 0)) return null;

  // Segundo candado: aunque el sello esté vacío, un solo pedido previo
  // (p. ej. creado antes de que existiera esta función) ya lo descalifica.
  const previousOrders = await prisma.order.count({ where: { wholesaleUserId: user.id } });
  if (previousOrders > 0) return null;

  return { percentage };
}

// El cálculo del monto vive en `carlin-pricing` porque también lo usa el
// carrito (componente cliente) y este módulo importa Prisma.
export { computeWelcomeDiscountAmount } from '@/lib/utils/carlin-pricing';
