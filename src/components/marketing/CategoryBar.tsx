'use client';

import * as React from 'react';
import Link from 'next/link';
import { m, useReducedMotion } from 'framer-motion';
import CategoryIcon from './CategoryIcon';

export interface CategoryBarProps {
  categories: { id: string; name: string; slug: string }[];
}

export function CategoryBar({ categories }: CategoryBarProps) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <m.section
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="py-16 px-4 md:px-8 overflow-x-hidden"
    >
      <div className="max-w-7xl mx-auto">
        <m.div
          variants={containerVariants}
          initial={prefersReducedMotion ? "show" : "hidden"}
          whileInView="show"
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-6 md:gap-8"
        >
          {categories.map((cat) => (
            <m.div
              key={cat.id}
              variants={prefersReducedMotion ? {} : itemVariants}
              whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Link href={`/catalogo/${cat.slug}`} className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 rounded-full bg-brand-pink-light border-2 border-brand-pink/20 flex items-center justify-center transition-all duration-300 group-hover:bg-brand-pink group-hover:border-brand-pink group-hover:shadow-[0_4px_20px_rgba(251,156,208,0.4)] group-hover:[&_.cat-icon]:icon-white">
                  <CategoryIcon slug={cat.slug} size={28} className="cat-icon icon-pink transition-all duration-300" />
                </div>
                <span className="text-xs font-sans uppercase tracking-wider text-brand-neutral-dark group-hover:text-brand-pink-dark transition-colors duration-300 text-center max-w-[80px] leading-tight">
                  {cat.name}
                </span>
              </Link>
            </m.div>
          ))}
        </m.div>
      </div>
    </m.section>
  );
}
