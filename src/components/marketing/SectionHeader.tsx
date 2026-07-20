'use client';

import * as React from 'react';
import { m, useReducedMotion } from 'framer-motion';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, className = '' }: SectionHeaderProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.div
      initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`max-w-4xl mx-auto mb-12 ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-brand-pink/30" />
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-neutral-dark whitespace-nowrap">
          {title}
        </h2>
        <div className="flex-1 h-px bg-brand-pink/30" />
      </div>
      {subtitle && (
        <p className="font-sans text-sm text-brand-neutral-500 text-center mt-3">
          {subtitle}
        </p>
      )}
    </m.div>
  );
}
