'use client';

import * as React from 'react';
import { useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HorizontalCarouselProps {
  children: React.ReactNode;
  /** Milisegundos entre avances automáticos. 0 o ausente = sin auto-avance. */
  autoScrollMs?: number;
  /** Flechas circulares pegadas a los bordes (como la referencia). */
  showArrows?: boolean;
  /** Clase del contenedor con scroll (para separación entre slides, padding…). */
  trackClassName?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * Carrusel horizontal con auto-avance, usado por las tres franjas de la home
 * (categorías, más vendidos e Instagram).
 *
 * Usa **scroll nativo + scroll-snap** en vez de un `translateX` calculado: así el
 * swipe táctil en móvil y el scroll con trackpad funcionan solos, y el
 * "deslizamiento suave" lo hace el navegador con `behavior: 'smooth'`.
 *
 * Cada hijo debe ser un slide; el ancho lo decide el propio hijo (`shrink-0` +
 * su clase de ancho), para que cada sección elija cuántos se ven a la vez.
 */
export function HorizontalCarousel({
  children,
  autoScrollMs = 0,
  showArrows = true,
  trackClassName,
  className,
  ariaLabel,
}: HorizontalCarouselProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [paused, setPaused] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();

  /** Ancho de un slide (incluye el gap) para avanzar de a uno. */
  const stepSize = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const first = track.firstElementChild as HTMLElement | null;
    if (!first) return track.clientWidth;
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return first.getBoundingClientRect().width + gap;
  }, []);

  const scrollByStep = React.useCallback(
    (direction: 1 | -1) => {
      const track = trackRef.current;
      if (!track) return;
      track.scrollBy({
        left: stepSize() * direction,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    },
    [stepSize, prefersReducedMotion]
  );

  // Auto-avance. Al llegar al final vuelve al principio para que el ciclo no se
  // quede clavado en el último slide.
  React.useEffect(() => {
    if (!autoScrollMs || paused || prefersReducedMotion) return;

    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;

      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        track.scrollBy({ left: stepSize(), behavior: 'smooth' });
      }
    }, autoScrollMs);

    return () => window.clearInterval(id);
  }, [autoScrollMs, paused, prefersReducedMotion, stepSize]);

  const arrowClass =
    'absolute top-1/2 z-20 hidden -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full ' +
    'bg-white/80 text-brand-pink-dark shadow-md backdrop-blur transition-colors hover:bg-white ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink sm:flex';

  return (
    <div
      className={cn('group/carousel relative', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        className={cn(
          'no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth',
          trackClassName
        )}
      >
        {children}
      </div>

      {showArrows && (
        <>
          <button
            type="button"
            onClick={() => scrollByStep(-1)}
            aria-label="Anterior"
            className={cn(arrowClass, 'left-2 sm:left-4')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByStep(1)}
            aria-label="Siguiente"
            className={cn(arrowClass, 'right-2 sm:right-4')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}
