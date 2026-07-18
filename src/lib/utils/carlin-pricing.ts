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

export function isWholesaleActive(lastOrderAt: Date | null, inactivityDays: number = 30): boolean {
  if (!lastOrderAt) return false;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastOrderAt.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= inactivityDays;
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
