'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { m, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { X } from 'lucide-react';
import type { PromoPopup as PromoPopupModel } from '@prisma/client';

const SEEN_KEY = 'carlin-promo-seen';

interface PromoPopupProps {
  popup: PromoPopupModel | null;
}

export function PromoPopup({ popup }: PromoPopupProps) {
  const [visible, setVisible] = React.useState(() => !!popup && !popup.showOnce);

  React.useEffect(() => {
    if (!popup?.showOnce) return;

    const seen = localStorage.getItem(SEEN_KEY);
    if (seen === popup.id) return;

    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [popup]);

  const handleClose = () => {
    if (popup?.showOnce) {
      localStorage.setItem(SEEN_KEY, popup.id);
    }
    setVisible(false);
  };

  if (!popup || !popup.active) {
    return null;
  }

  const hasText = !!(popup.title || popup.ctaText);

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {visible && (
          <m.div
            key="promo-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <m.div
              key="promo-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-md w-full rounded-3xl overflow-hidden bg-white relative"
              onClick={(e) => e.stopPropagation()}
            >
              {popup.imageUrl && (
                <div className="relative w-full aspect-[4/3]">
                  <Image
                    src={popup.imageUrl}
                    fill
                    unoptimized
                    className="object-cover"
                    alt={popup.title ?? 'Promoción'}
                  />
                </div>
              )}

              {hasText && (
                <div className="p-6 text-center">
                  {popup.title && (
                    <h2 className="font-serif text-2xl font-bold text-brand-pink-dark">
                      {popup.title}
                    </h2>
                  )}
                  {popup.subtitle && (
                    <p className="mt-2 text-sm text-neutral-500">{popup.subtitle}</p>
                  )}
                  {popup.ctaText && popup.ctaHref && (
                    <Link
                      href={popup.ctaHref}
                      onClick={handleClose}
                      className="mt-4 block w-full rounded-2xl bg-brand-pink text-white font-nunito font-bold py-3 hover:bg-brand-pink-dark transition-colors"
                    >
                      {popup.ctaText}
                    </Link>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleClose}
                aria-label="Cerrar"
                className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-white text-neutral-500 hover:text-brand-pink-dark shadow-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>
  );
}
