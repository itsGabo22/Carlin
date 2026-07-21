'use client';

import * as React from 'react';
import { m, useScroll, useTransform, AnimatePresence, LazyMotion, domAnimation } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function ScrollToTopButton() {
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  
  // Mostrar el botón solo después de hacer algo de scroll (5% de la página)
  const isVisible = useTransform(scrollYProgress, (v) => v > 0.05);
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    return isVisible.on('change', (latest) => {
      setShow(latest);
    });
  }, [isVisible]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence>
        {show && (
        <m.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={scrollToTop}
          className="fixed bottom-[88px] right-6 z-40 w-14 h-14 rounded-full bg-white shadow-lg shadow-brand-pink/30 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink text-brand-pink hover:text-brand-pink-dark transition-colors"
          aria-label="Volver arriba"
        >
          {/* SVG para el anillo de progreso */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 56 56">
            <m.circle
              cx="28" cy="28" r="26"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-brand-pink"
              style={{ pathLength: scrollYProgress }}
            />
          </svg>
          
          <ArrowUp className="w-6 h-6 relative z-10" />
        </m.button>
      )}
      </AnimatePresence>
    </LazyMotion>
  );
}
