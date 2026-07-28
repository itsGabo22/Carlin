'use client';

import { m, useReducedMotion } from 'framer-motion';
import Link from 'next/link';

export function WholesalePulseButton() {
  const prefersReduced = useReducedMotion();

  return (
    <div className="relative inline-flex">
      {/* Pulse rings — 2 concentric rings that expand and fade, like a sonar effect */}
      {!prefersReduced && (
        <>
          <m.span
            className="absolute inline-flex rounded-full bg-white/30 pointer-events-none"
            style={{ width: '100%', height: '100%', minWidth: '180px', minHeight: '52px', borderRadius: '9999px' }}
            animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          <m.span
            className="absolute inline-flex rounded-full bg-white/20 pointer-events-none"
            style={{ width: '100%', height: '100%', minWidth: '180px', minHeight: '52px', borderRadius: '9999px' }}
            animate={{ scale: [1, 2], opacity: [0.3, 0] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.4,
            }}
          />
        </>
      )}

      {/* Actual button */}
      <Link
        href="/registro-mayorista"
        className="relative px-10 py-4 rounded-full border-2 border-white text-white font-bold text-base backdrop-blur-sm bg-white/10 hover:bg-white/25 transition-colors duration-300 whitespace-nowrap z-10 min-w-[180px] text-center"
      >
        Soy Mayorista
      </Link>
    </div>
  );
}
