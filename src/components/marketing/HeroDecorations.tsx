'use client'

import { m, useTransform } from 'framer-motion'
import { usePageScroll } from '@/hooks/usePageScroll'
import { useReducedMotion } from 'framer-motion'

// Cada decoración: posición, tamaño, velocidad de scroll, delay
interface Decoration {
  id: string
  top?: string; bottom?: string
  left?: string; right?: string
  size: number
  scrollFactor: number  // cuánto se mueve con el scroll
  animDelay: string
  animDuration: string
  opacity: number
  shape: 'lipstick' | 'star' | 'heart' | 'sparkle' | 'flower' | 'ring'
}

const DECORATIONS: Decoration[] = [
  { id: 'd1', top: '12%',  left: '8%',   size: 28, scrollFactor: 0.15,
    animDelay: '0s',    animDuration: '8s',  opacity: 0.35, shape: 'lipstick' },
  { id: 'd2', top: '20%',  right: '10%', size: 20, scrollFactor: 0.25,
    animDelay: '1.5s',  animDuration: '6s',  opacity: 0.25, shape: 'star' },
  { id: 'd3', top: '60%',  left: '5%',   size: 16, scrollFactor: 0.3,
    animDelay: '0.5s',  animDuration: '7s',  opacity: 0.2,  shape: 'heart' },
  { id: 'd4', top: '75%',  right: '8%',  size: 24, scrollFactor: 0.1,
    animDelay: '2s',    animDuration: '9s',  opacity: 0.3,  shape: 'sparkle' },
  { id: 'd5', top: '35%',  left: '14%',  size: 14, scrollFactor: 0.4,
    animDelay: '3s',    animDuration: '5s',  opacity: 0.2,  shape: 'star' },
  { id: 'd6', bottom: '25%', right: '15%', size: 20, scrollFactor: 0.2,
    animDelay: '1s',    animDuration: '8s',  opacity: 0.25, shape: 'flower' },
  { id: 'd7', top: '45%',  right: '5%',  size: 18, scrollFactor: 0.35,
    animDelay: '2.5s',  animDuration: '7s',  opacity: 0.2,  shape: 'ring' },
  { id: 'd8', bottom: '15%', left: '12%', size: 12, scrollFactor: 0.45,
    animDelay: '0.8s',  animDuration: '6s',  opacity: 0.18, shape: 'sparkle' },
]

// SVGs de las formas — simples, elegantes, line art
function ShapeIcon({ shape, size }: { shape: Decoration['shape']; size: number }) {
  const props = {
    width: size, height: size,
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    xmlns: 'http://www.w3.org/2000/svg',
  }

  switch (shape) {
    case 'star':
      return (
        <svg {...props}>
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3
            2.4-7.4L2 9.4h7.6z" fillOpacity="0.9" />
        </svg>
      )
    case 'heart':
      return (
        <svg {...props}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
            2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
            C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
            c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...props}>
          <path d="M12 1l1.5 4.5L18 7l-4.5 1.5L12 13l-1.5-4.5L6 7
            l4.5-1.5zM5 15l.75 2.25L8 18l-2.25.75L5 21l-.75-2.25
            L2 18l2.25-.75z" />
        </svg>
      )
    case 'flower':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="2.5" />
          <ellipse cx="12" cy="6.5" rx="2" ry="3" />
          <ellipse cx="12" cy="17.5" rx="2" ry="3" />
          <ellipse cx="6.5" cy="12" rx="3" ry="2" />
          <ellipse cx="17.5" cy="12" rx="3" ry="2" />
          <ellipse cx="8.2" cy="8.2" rx="2" ry="3"
            transform="rotate(-45 8.2 8.2)" />
          <ellipse cx="15.8" cy="15.8" rx="2" ry="3"
            transform="rotate(-45 15.8 15.8)" />
          <ellipse cx="15.8" cy="8.2" rx="2" ry="3"
            transform="rotate(45 15.8 8.2)" />
          <ellipse cx="8.2" cy="15.8" rx="2" ry="3"
            transform="rotate(45 8.2 15.8)" />
        </svg>
      )
    case 'ring':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" fill="none"
            stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" fill="none"
            stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 4 C14 4 16 5 17 7" stroke="currentColor"
            strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      )
    case 'lipstick':
    default:
      return (
        <svg {...props}>
          <rect x="9" y="2" width="6" height="4" rx="1" fillOpacity="0.9" />
          <path d="M9 6h6v2.5a3 3 0 0 1-6 0V6z" />
          <rect x="8" y="8" width="8" height="12" rx="1" fillOpacity="0.9" />
          <rect x="8" y="14" width="8" height="1" fillOpacity="0.6" />
        </svg>
      )
  }
}

export default function HeroDecorations() {
  const scrollY = usePageScroll()
  const prefersReducedMotion = useReducedMotion()

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true">
      {DECORATIONS.map((dec) => {
        const y = useTransform(
          scrollY,
          [0, 600],
          [0, -600 * dec.scrollFactor]
        )
        return (
          <m.div
            key={dec.id}
            className="absolute text-white hero-shape"
            style={{
              top: dec.top,
              bottom: dec.bottom,
              left: dec.left,
              right: dec.right,
              opacity: dec.opacity,
              y: prefersReducedMotion ? 0 : y,
              animation: prefersReducedMotion
                ? 'none'
                : `float-slow ${dec.animDuration} ease-in-out infinite ${dec.animDelay}`,
            }}
          >
            <ShapeIcon shape={dec.shape} size={dec.size} />
          </m.div>
        )
      })}
    </div>
  )
}
