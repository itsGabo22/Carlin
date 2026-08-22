import type { SiteConfig } from '@prisma/client';
import type { PriceLevel } from '@/lib/auth/carlin-session';

/**
 * Nivel de precio EFECTIVO de un pedido mayorista.
 *
 * REGLA DE NEGOCIO (confirmada por la clienta, agosto 2026): "Distribuidor"
 * dejó de ser un tipo de cuenta. Sólo existe UNA cuenta mayorista, y el nivel
 * de precio depende del TAMAÑO DEL PEDIDO, no del registro:
 *
 *   - menos de `wholesaleMinOrder`  → no hay pedido: falta para el mínimo
 *   - `wholesaleMinOrder` .. `distributorMinOrder` → precio mayorista
 *   - `distributorMinOrder` o más   → precio distribuidor (automático)
 *
 * Nadie se registra como distribuidor y el campo `WholesaleUser.role` ya no
 * interviene: se conserva por historia, pero no decide ningún precio.
 *
 * ── Sobre qué subtotal se miden los umbrales ──────────────────────────────
 * Siempre sobre el subtotal al precio MAYORISTA (el nivel base de la cuenta),
 * nunca sobre el ya escalado. Medirlo sobre el precio distribuidor sería
 * circular: un carrito de 420.000 a precio mayorista vale ~360.000 a precio
 * distribuidor, así que al escalar volvería a caer por debajo de los 400.000 y
 * el tramo sería inalcanzable. El subtotal mayorista es además el que el
 * cliente ve en el catálogo y en el carrito antes de escalar.
 */
export interface TierOutcome {
  /** Nivel al que hay que cobrar realmente este pedido. */
  priceLevel: PriceLevel;
  /** Nivel base de la cuenta (el de la sesión), antes de escalar. */
  baseLevel: PriceLevel;
  /** Subtotal medido al nivel base: la referencia de los dos umbrales. */
  baseSubtotal: number;
  /** `true` si el tamaño del pedido subió el nivel a distribuidor. */
  escalated: boolean;
  /** ¿Llega al mínimo para poder pedir? En detal siempre `true`. */
  meetsMinimum: boolean;
  /** Mínimo exigido a esta sesión (0 en detal). */
  minimumRequired: number;
  /** Cuánto falta para el mínimo (0 si ya se cumple). */
  missing: number;
  /** Umbral a partir del cual se aplica el precio distribuidor (0 en detal). */
  escalationThreshold: number;
  /** Cuánto falta para el precio distribuidor (0 si ya se aplica). */
  missingForEscalation: number;
}

type TierConfig = Pick<SiteConfig, 'wholesaleMinOrder' | 'distributorMinOrder'>;

/** Mensaje de bloqueo con el importe exacto que falta. */
export function minimumNotMetMessage(outcome: TierOutcome, format: (n: number) => string): string {
  return (
    `El pedido mínimo para mayoristas es ${format(outcome.minimumRequired)}. ` +
    `Tu carrito suma ${format(outcome.baseSubtotal)}: te faltan ${format(outcome.missing)} ` +
    `para poder confirmarlo.`
  );
}

export function resolveWholesaleTier({
  baseLevel,
  baseSubtotal,
  config,
}: {
  baseLevel: PriceLevel;
  baseSubtotal: number;
  config: TierConfig;
}): TierOutcome {
  // El detal no tiene mínimo ni escalado: se queda como está.
  if (baseLevel === 'retail') {
    return {
      priceLevel: 'retail',
      baseLevel: 'retail',
      baseSubtotal,
      escalated: false,
      meetsMinimum: true,
      minimumRequired: 0,
      missing: 0,
      escalationThreshold: 0,
      missingForEscalation: 0,
    };
  }

  const minimumRequired = Number(config.wholesaleMinOrder);
  const escalationThreshold = Number(config.distributorMinOrder);

  const meetsMinimum = baseSubtotal >= minimumRequired;
  const escalated = baseSubtotal >= escalationThreshold;

  return {
    priceLevel: escalated ? 'distributor' : 'wholesale',
    baseLevel: 'wholesale',
    baseSubtotal,
    escalated,
    meetsMinimum,
    minimumRequired,
    missing: meetsMinimum ? 0 : Math.max(0, minimumRequired - baseSubtotal),
    escalationThreshold,
    missingForEscalation: escalated ? 0 : Math.max(0, escalationThreshold - baseSubtotal),
  };
}
