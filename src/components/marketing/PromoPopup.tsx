'use client';

import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface PromoPopupData {
  id: string;
  active: boolean;
  imageUrl?: string | null;
  title?: string | null;
  subtitle?: string | null;
  ctaText?: string | null;
  ctaHref?: string | null;
  showOnce: boolean;
}

export function PromoPopup({ popup }: { popup: PromoPopupData | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!popup || !popup.active) return;

    if (popup.showOnce) {
      const key = `carlin-popup-${popup.id}`;
      if (localStorage.getItem(key)) return;
    }

    // Always show after 1.5s if active
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [popup]);

  const handleClose = () => {
    if (popup?.showOnce) {
      localStorage.setItem(`carlin-popup-${popup.id}`, '1');
    }
    setVisible(false);
  };

  if (!popup || !popup.active) return null;

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          key="popup-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <m.div
            key="popup-card"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 shadow-md flex items-center justify-center text-neutral-500 hover:text-brand-pink transition-colors text-lg font-bold"
              aria-label="Cerrar"
            >
              ✕
            </button>

            {/* Image */}
            {popup.imageUrl && (
              <div className="relative w-full aspect-square">
                <Image
                  src={popup.imageUrl}
                  alt={popup.title ?? 'Promoción'}
                  fill
                  unoptimized
                  className="object-cover"
                  priority
                />
              </div>
            )}

            {/* Text content */}
            {(popup.title || popup.ctaText) && (
              <div className="p-5 text-center">
                {popup.title && (
                  <h2 className="font-serif text-xl font-bold text-brand-pink-dark mb-1">
                    {popup.title}
                  </h2>
                )}
                {popup.subtitle && (
                  <p className="text-sm text-neutral-500 mb-3">{popup.subtitle}</p>
                )}
                {popup.ctaText && popup.ctaHref && (
                  <Link
                    href={popup.ctaHref}
                    onClick={handleClose}
                    className="block w-full py-3 rounded-2xl bg-brand-pink text-white font-semibold text-sm hover:bg-brand-pink-dark transition-colors"
                  >
                    {popup.ctaText}
                  </Link>
                )}
              </div>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
