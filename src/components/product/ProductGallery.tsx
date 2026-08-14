'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';

// ─── Props ────────────────────────────────────────────────────────────────────
export interface ProductGalleryProps {
  images: string[];
  productName: string;
  activeVariantImage?: string;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProductGallery({
  images,
  productName,
  activeVariantImage,
  className,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [direction, setDirection] = React.useState<1 | -1>(1);

  // Automatically reset active index to 0 when active variant image changes
  React.useEffect(() => {
    setActiveIndex(0);
  }, [activeVariantImage, images]);

  const handleSelect = (index: number) => {
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  };

  // ── Empty / no-image state ───────────────────────────
  if (images.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-brand-cream border border-brand-pink-light/30',
          'aspect-square w-full',
          className,
        )}
        aria-label={`Sin imagen disponible para ${productName}`}
        role="img"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="56"
          height="56"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-brand-pink-dark/30"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  const currentImage = images[activeIndex] || images[0];

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* ── Main image container (Bloomshell luxury ratio 4/5 with subtle rounded glass card) ── */}
      <div
        className="relative w-full overflow-hidden rounded-2xl bg-white border border-brand-pink-light/20 shadow-sm"
        style={{ aspectRatio: '4 / 5' }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentImage}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0"
          >
            <Image
              src={currentImage}
              alt={`${productName} — foto ${activeIndex + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority={activeIndex === 0}
              unoptimized
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Thumbnails ──────────────────────────────────── */}
      {images.length > 1 && (
        <div
          className="flex gap-2.5 overflow-x-auto pb-1"
          role="list"
          aria-label={`Imágenes de ${productName}`}
        >
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              role="listitem"
              onClick={() => handleSelect(index)}
              aria-label={`Ver imagen ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              className={cn(
                'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2',
                index === activeIndex
                  ? 'border-brand-pink shadow-md scale-105 ring-2 ring-brand-pink/20'
                  : 'border-transparent opacity-70 hover:opacity-100 hover:border-brand-pink-light/60',
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
