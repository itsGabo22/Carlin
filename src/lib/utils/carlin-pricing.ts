import { Role, SiteConfig, Prisma } from '@prisma/client';
type Decimal = Prisma.Decimal;

type PriceValue = Decimal | number | string;

export function formatCOP(amount: PriceValue): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

export function getEffectivePrice(
  product: { retailPrice: PriceValue; wholesalePrice: PriceValue; distributorPrice: PriceValue },
  userRole?: Role | null
): PriceValue {
  if (userRole === 'DISTRIBUIDOR') return product.distributorPrice;
  if (userRole === 'MAYORISTA') return product.wholesalePrice;
  return product.retailPrice;
}

export function getStrikethroughPrice(
  product: { retailPrice: PriceValue; comparePrice?: PriceValue | null },
  userRole?: Role | null
): PriceValue | null {
  if (userRole === 'MAYORISTA' || userRole === 'DISTRIBUIDOR') {
    return product.retailPrice;
  }
  return product.comparePrice ?? null;
}

/**
 * ¿La cuenta mayorista sigue "activa" (es decir, conserva su precio especial)?
 *
 * La regla de negocio es "si dejas de comprar durante `inactivityDays`, vuelves
 * a precio de detal". El problema es que un mayorista recién aprobado todavía no
 * tiene `lastOrderAt`, y devolver `false` ahí lo dejaba en precio RETAIL: no podía
 * ver los precios mayoristas para poder hacer la primera compra que, precisamente,
 * era lo único que activaba su cuenta.
 *
 * Por eso, mientras no exista `lastOrderAt` se usa `sinceDate` (la fecha de
 * aprobación) como base: la cuenta nace activa y tiene la misma ventana de
 * `inactivityDays` para estrenarse.
 */
export function isWholesaleActive(
  lastOrderAt: Date | null,
  inactivityDays: number = 30,
  sinceDate?: Date | null
): boolean {
  const baseDate = lastOrderAt ?? sinceDate;
  if (!baseDate) return false;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - new Date(baseDate).getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= inactivityDays;
}

/**
 * Monto del descuento de bienvenida, en pesos enteros.
 * `base` ya debe venir con el cupón (si lo hay) descontado: los dos descuentos
 * se acumulan, el de bienvenida cae sobre el total ya rebajado.
 */
export function computeWelcomeDiscountAmount(base: number, percentage: number): number {
  if (!(base > 0) || !(percentage > 0)) return 0;
  return Math.round(base * (percentage / 100));
}

export function checkMinimumOrder(
  total: Decimal | number,
  userRole: Role,
  siteConfig: SiteConfig
): { meetsMinimum: boolean; required: Decimal | number; missing: number } {
  const numericTotal = Number(total);
  let required = 0;

  if (userRole === 'DISTRIBUIDOR') {
    required = Number(siteConfig.distributorMinOrder);
  } else if (userRole === 'MAYORISTA') {
    required = Number(siteConfig.wholesaleMinOrder);
  } else {
    return { meetsMinimum: true, required: 0, missing: 0 };
  }

  const meetsMinimum = numericTotal >= required;
  const missing = meetsMinimum ? 0 : required - numericTotal;

  return { meetsMinimum, required, missing };
}

export function getApplicableDiscounts(
  product: { discounts?: any[] },
  priceLevel: string
): any[] {
  if (!product.discounts) return [];
  return product.discounts.filter(d => {
    const discount = d.discount || d;
    if (!discount.active) return false;
    if (discount.couponCode && discount.couponCode.trim() !== '') return false;
    
    const now = new Date();
    if (discount.startsAt && new Date(discount.startsAt) > now) return false;
    if (discount.endsAt && new Date(discount.endsAt) < now) return false;
    
    if (discount.audience === 'WHOLESALE' && priceLevel !== 'wholesale') return false;
    if (discount.audience === 'DISTRIBUTOR' && priceLevel !== 'distributor') return false;
    
    return true;
  });
}

