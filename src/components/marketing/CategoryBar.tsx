'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { m, useReducedMotion } from 'framer-motion';

export interface CategoryBarProps {
  categories: { id: string; name: string; slug: string }[];
}

const BUBBLE_SHADES = ['#FFBDE1', '#FB9CD0', '#FFF0F7', '#E879F9', '#FBCFE8', '#FCE7F3'];

const ICON_MAP: Record<string, string> = {
  'maquillaje': '/icons/categories/makeup.png',
  'accesorios': '/icons/categories/accesories.png', // one 's'
  'cuidado-facial': '/icons/categories/skincare.png',
  'cuidado-capilar': '/icons/categories/haircare.png',
  default: '/icons/categories/makeup.png',
};

const SPARKLE_STARS = [
  { top: '6%', left: '5%', fontSize: 22, delay: '0s' },
  { top: '10%', right: '8%', fontSize: 16, delay: '0.8s' },
  { bottom: '8%', left: '10%', fontSize: 18, delay: '1.5s' },
  { bottom: '12%', right: '6%', fontSize: 24, delay: '2s' },
];

const SPARKLE_DOTS = [
  { top: '8px', right: '14px', size: 8, color: '#E879F9', delay: '0s' },
  { bottom: '10px', left: '10px', size: 6, color: '#FB9CD0', delay: '0.6s' },
  { top: '20px', left: '8px', size: 5, color: '#FFBDE1', delay: '1.2s' },
];

const containerVariants = (prefersReduced: boolean) => ({
  hidden: {},
  show: {
    transition: { staggerChildren: prefersReduced ? 0 : 0.1 },
  },
});

const itemVariants = (prefersReduced: boolean) => ({
  hidden: { opacity: 0, y: prefersReduced ? 0 : 28, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
});

export function CategoryBar({ categories }: CategoryBarProps) {
  const prefersReduced = !!useReducedMotion();

  const bubbles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        size: 20 + ((i * 7) % 40),
        left: (i * 19 + 5) % 95,
        duration: 6 + ((i * 3) % 8),
        delay: (i * 1.3) % 8,
        color: BUBBLE_SHADES[i % BUBBLE_SHADES.length],
      })),
    []
  );

  return (
    <section className="relative overflow-hidden py-12 md:py-16" style={{ background: '#FFF0F7' }}>
      {/* Bubble layer */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="carlin-bubble absolute rounded-full pointer-events-none"
            style={{
              width: `${b.size}px`,
              height: `${b.size}px`,
              left: `${b.left}%`,
              bottom: '-60px',
              background: b.color,
              opacity: 0,
              animation: `carlin-bubble-rise ${b.duration}s linear ${b.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Sparkle stars */}
      {SPARKLE_STARS.map((s, i) => (
        <span
          key={i}
          className="carlin-sparkle-star absolute z-0 pointer-events-none select-none"
          aria-hidden="true"
          style={{
            top: s.top,
            bottom: s.bottom,
            left: s.left,
            right: s.right,
            color: '#DB2777',
            opacity: 0.2,
            fontSize: `${s.fontSize}px`,
            animation: `carlin-sparkle 3s ease-in-out infinite ${s.delay}`,
          }}
        >
          ✦
        </span>
      ))}

      <div className="relative z-10 px-4 max-w-5xl mx-auto">
        {/* Section header */}
        <div className="flex flex-col items-center mb-10 md:mb-12">
          <p
            className="text-2xl md:text-3xl text-center mb-2"
            style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, color: '#DB2777' }}
          >
            ¡Explora nuestras categorías!
          </p>
          <span
            className="bg-white rounded-full uppercase"
            style={{
              border: '1.5px solid #FFBDE1',
              color: '#FB9CD0',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 16px',
              letterSpacing: '0.08em',
            }}
          >
            Todo para tu belleza
          </span>
        </div>

        {/* Category grid */}
        <m.div
          variants={containerVariants(prefersReduced)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 justify-items-center gap-6 sm:flex sm:flex-wrap sm:justify-center sm:gap-8 lg:gap-12"
        >
          {categories.map((cat, i) => (
            <m.div key={cat.id} variants={itemVariants(prefersReduced)}>
              <Link href={`/catalogo/${cat.slug}`} className="flex flex-col items-center gap-3 group">
                <div
                  className="carlin-cat-circle relative w-[100px] h-[100px] sm:w-[140px] sm:h-[140px] rounded-full bg-white border-[3px] border-[#FFBDE1] flex items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer shadow-[0_4px_20px_rgba(251,156,208,0.25)] group-hover:border-[#FB9CD0] group-hover:shadow-[0_12px_32px_rgba(251,156,208,0.45)]"
                  style={{
                    animation: `carlin-float-icon ${3 + i * 0.7}s ease-in-out infinite`,
                    animationDelay: `${-i * 0.7}s`,
                  }}
                >
                  {SPARKLE_DOTS.map((dot, di) => (
                    <span
                      key={di}
                      className="carlin-sparkle-dot absolute rounded-full pointer-events-none"
                      style={{
                        width: dot.size,
                        height: dot.size,
                        top: dot.top,
                        bottom: dot.bottom,
                        left: dot.left,
                        right: dot.right,
                        background: dot.color,
                        animation: `carlin-sparkle 2s ease-in-out infinite ${dot.delay}`,
                      }}
                    />
                  ))}

                  <Image
                    src={ICON_MAP[cat.slug] ?? ICON_MAP.default}
                    alt={cat.name}
                    width={88}
                    height={88}
                    unoptimized
                    className="w-[88px] h-[88px] sm:w-[120px] sm:h-[120px] object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <span className="text-[11px] font-extrabold tracking-widest uppercase text-[#DB2777] text-center leading-tight transition-colors duration-300 group-hover:text-[#FB9CD0]">
                  {cat.name}
                </span>
              </Link>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
