'use client';

import * as React from 'react';
import Link from 'next/link';
import { X, Gift, Sparkles, MessageCircle, ShoppingBag, BadgeCheck, TrendingDown } from 'lucide-react';
import { formatCOP } from '@/lib/utils/carlin-pricing';

interface WelcomePanelProps {
  /** Nombre a saludar (nombre de pila si viene completo). */
  name: string | null;
  /** Mínimo para desbloquear el precio mayorista (`wholesaleMinOrder`). */
  minOrder: number;
  /** Desde este total el pedido pasa a precio distribuidor automáticamente. */
  distributorThreshold: number;
  /** % de bienvenida real leído de la config; null si esta cuenta no lo tiene. */
  welcomeDiscountPercentage: number | null;
  /** Título editable desde /admin. Admite el token {nombre}. */
  title?: string | null;
  /** Mensaje editable desde /admin. Texto plano: nunca se interpreta como HTML. */
  message?: string | null;
  /**
   * Imagen diseñada por la tienda. Cuando existe, SUSTITUYE a la cabecera
   * degradada y no se le superpone ningún texto: el diseño suele traer el suyo
   * propio y se pisarían. El saludo baja al cuerpo blanco.
   */
  imageUrl?: string | null;
}

/**
 * Antes había un `TIER_COPY` con dos entradas (Mayorista / Distribuidor) y el
 * panel se pintaba según el `role` de la cuenta. Ya no hay dos tipos de
 * cuenta: toda cuenta aprobada es mayorista y el precio de distribuidor se
 * gana por tamaño de pedido, así que el panel explica los DOS TRAMOS en lugar
 * de anunciar un tier.
 */
const TIER_COPY = {
  label: 'Mayorista',
  // Rosa Bloomshell. `ring` va sobre el degradado; `onWhite`, sobre el cuerpo.
  ring: 'text-brand-pink-dark bg-white/85',
  onWhite: 'text-brand-pink-dark bg-brand-cream',
} as const;

/** Sustituye {nombre} por el nombre de pila; si no hay, limpia el hueco. */
function renderTitle(template: string, firstName: string | null): string {
  return template
    .replace(/\{nombre\}/gi, firstName ?? '')
    .replace(/\s{2,}/g, ' ')
    // Deja "¡Bienvenida, !" o "Hola ," presentables cuando no hay nombre.
    .replace(/[,\s]+([!?.]|$)/g, '$1')
    .trim();
}

export function WelcomePanel({
  name,
  minOrder,
  distributorThreshold,
  welcomeDiscountPercentage,
  title,
  message,
  imageUrl,
}: WelcomePanelProps) {
  const [visible, setVisible] = React.useState(true);
  const closeRef = React.useRef<HTMLButtonElement>(null);

  const dismiss = React.useCallback(() => {
    setVisible(false);
    // Sella el "ya lo vio" en segundo plano: si la petición falla, el panel ya
    // se cerró para esta sesión y volverá a intentarlo en la siguiente visita.
    void fetch('/api/mayoristas/bienvenida', { method: 'POST' }).catch(() => {});
  }, []);

  // Bloquea el scroll del fondo mientras el panel está abierto y permite cerrar con Esc.
  // El scroll real ocurre en <html> (document.scrollingElement), no en <body> —
  // mismo bug confirmado en vivo en MobileNav.tsx.
  React.useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [visible, dismiss]);

  if (!visible) return null;

  const firstName = name?.trim().split(/\s+/)[0] ?? null;
  const copy = TIER_COPY;
  const hasDiscount = !!welcomeDiscountPercentage && welcomeDiscountPercentage > 0;

  const headingText = title?.trim()
    ? renderTitle(title, firstName)
    : firstName
      ? `¡Bienvenida, ${firstName}!`
      : '¡Bienvenida a CARLIN!';

  /**
   * Ojo / eyebrow + título + badge de tier. Se pinta en blanco sobre el
   * degradado, o en oscuro sobre el cuerpo blanco cuando hay imagen propia.
   */
  const identity = (onImage: boolean) => (
    <>
      <p
        className={`relative mb-2 flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] ${onImage ? 'text-brand-pink-dark' : 'text-white/95'
          }`}
      >
        <BadgeCheck className="h-3.5 w-3.5" />
        Cuenta aprobada
      </p>

      <h2
        id="carlin-welcome-title"
        className={`relative font-serif text-3xl font-bold leading-tight sm:text-4xl ${onImage ? 'text-brand-neutral-dark' : 'text-white drop-shadow-sm'
          }`}
      >
        {headingText}
      </h2>

      <span
        className={`relative mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm ${onImage ? copy.onWhite : copy.ring
          }`}
      >
        Cuenta {copy.label}
      </span>
    </>
  );

  return (
    <div
      className="carlin-welcome-overlay fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-brand-neutral-900/45 p-4 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="carlin-welcome-title"
      onClick={dismiss}
    >
      <div
        className="carlin-welcome-card relative my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl shadow-brand-pink/20"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-brand-neutral-dark backdrop-blur transition-colors hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* ── Cabecera ─────────────────────────────────────────── */}
        {imageUrl ? (
          // Diseño propio de la tienda: se muestra tal cual, a su proporción y
          // SIN nada superpuesto, porque suele traer texto incrustado.
          <img
            src={imageUrl}
            alt=""
            className="block w-full"
          />
        ) : (
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-pink-light via-brand-pink to-brand-distributor px-6 pb-8 pt-10 text-center sm:px-10">
            <span aria-hidden className="carlin-welcome-blob absolute -left-8 -top-10 h-32 w-32 rounded-full bg-white/25 blur-2xl" />
            <span aria-hidden className="carlin-welcome-blob absolute -bottom-12 -right-6 h-36 w-36 rounded-full bg-white/20 blur-2xl [animation-delay:-3s]" />

            <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg shadow-brand-pink-dark/20">
              <Sparkles className="h-8 w-8 text-brand-pink-dark" strokeWidth={1.75} />
            </div>

            {identity(false)}
          </div>
        )}

        {/* ── Cuerpo ───────────────────────────────────────────── */}
        <div className="space-y-5 px-6 py-6 sm:px-8">
          {imageUrl && <div className="text-center">{identity(true)}</div>}

          {message?.trim() && (
            <p className="whitespace-pre-line text-center text-sm leading-relaxed text-brand-text">
              {message.trim()}
            </p>
          )}

          {hasDiscount && (
            <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-brand-pink bg-brand-cream px-5 py-5 text-center">
              <span
                aria-hidden
                className="carlin-welcome-shine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-white/55"
              />
              <p className="relative flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-pink-dark">
                <Gift className="h-3.5 w-3.5" />
                Regalo de bienvenida
              </p>
              <p className="relative mt-1 font-serif text-5xl font-bold leading-none text-brand-pink-dark">
                {welcomeDiscountPercentage}
                <span className="text-3xl">%</span>
              </p>
              <p className="relative mt-1.5 text-sm font-semibold text-brand-neutral-dark">
                de descuento en tu primera compra
              </p>
              <p className="relative mt-2 text-xs leading-snug text-brand-text">
                Se aplica solo en tu primer pedido, sin códigos ni cupones.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-brand-cream bg-brand-neutral-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-text">
              Tu compra mínima
            </p>
            <p className="mt-0.5 font-sans text-2xl font-bold text-brand-neutral-dark">
              {formatCOP(minOrder)}
            </p>
            <p className="mt-1 text-xs leading-snug text-brand-text">
              Ya estás viendo los precios {copy.label.toLowerCase()} en todo el catálogo.
            </p>

            <div className="mt-3 flex items-start gap-2 border-t border-brand-cream pt-3">
              <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-brand-distributor-dark" />
              <p className="text-xs leading-snug text-brand-text">
                Y cuando un pedido llega a{' '}
                <strong className="font-bold text-brand-neutral-dark">
                  {formatCOP(distributorThreshold)}
                </strong>
                , se le aplica el <strong className="font-bold text-brand-neutral-dark">precio
                de distribuidor</strong> automáticamente. No hay que pedirlo.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-brand-text">
              Cómo pedir
            </p>
            <ol className="space-y-2.5">
              {[
                { icon: ShoppingBag, text: 'Arma tu pedido en el catálogo con tus precios especiales.' },
                { icon: Gift, text: 'Revisa el resumen en el carrito con tus descuentos ya aplicados.' },
                { icon: MessageCircle, text: 'Confirma y te llevamos a WhatsApp con el pedido listo.' },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-cream text-brand-pink-dark">
                    <step.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="pt-1 text-sm leading-snug text-brand-text">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row-reverse">
            <Link
              href="/catalogo"
              onClick={dismiss}
              className="flex-1 rounded-full bg-brand-pink-dark px-6 py-3.5 text-center text-sm font-bold text-white shadow-md shadow-brand-pink/30 transition-colors hover:bg-brand-pink"
            >
              Ver catálogo
            </Link>
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 rounded-full px-6 py-3.5 text-center text-sm font-semibold text-brand-text transition-colors hover:bg-brand-neutral-100 sm:flex-none sm:px-5"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
