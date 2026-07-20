'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { m, useTransform, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { usePageScroll } from '@/hooks/usePageScroll';
import HeroDecorations from './HeroDecorations';

export function HeroSection({ useVideo = false }: { useVideo?: boolean }) {
  const [mediaError, setMediaError] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();
  const scrollY = usePageScroll();

  const shapesY = useTransform(scrollY, [0, 600], [0, -80]);
  const contentY = useTransform(scrollY, [0, 600], [0, -40]);
  const chevronOpacity = useTransform(scrollY, [0, 100], [1, 0]);

  const storageBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hero-media/hero` 
    : '';

  const heroVideoDesktopUrl = `${storageBaseUrl}/video.webm`;
  const heroVideoDesktopUrlMp4 = `${storageBaseUrl}/video.mp4`;
  
  const heroImageDesktopUrl = storageBaseUrl ? `${storageBaseUrl}/desktop.webp` : '';

  const hasStorage = Boolean(storageBaseUrl);
  const showFallback = !hasStorage || mediaError;

  return (
    <section className="relative w-full h-[85vh] sm:h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-brand-pink-dark">
      {/* Dynamic Background */}
      {!showFallback ? (
        useVideo ? (
          <>
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="absolute inset-0 w-full h-full object-cover -z-20"
              onError={() => setMediaError(true)}
            >
              <source src={heroVideoDesktopUrl} type="video/webm" />
              <source src={heroVideoDesktopUrlMp4} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-brand-text/40 -z-10 backdrop-blur-[1px]" />
          </>
        ) : (
          heroImageDesktopUrl ? (
            <>
              <Image 
                src={heroImageDesktopUrl} 
                fill 
                priority={true}
                loading="eager"
                unoptimized
                className="object-cover -z-20" 
                alt="" 
                onError={() => setMediaError(true)}
              />
              <div className="absolute inset-0 bg-brand-pink-dark/40 -z-10" />
            </>
          ) : null
        )
      ) : (
        <m.div style={{ y: prefersReducedMotion ? 0 : shapesY }} className="absolute inset-0 overflow-hidden -z-20">
          {/* Fondo base: gradiente fijo */}
          <div className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #FFC8E3 0%, #FB9CD0 40%, #E05FA0 75%, #B5179E 100%)'
            }}
          />

          {/* Formas flotantes — capas de profundidad */}
          {/* Círculo grande detrás — se mueve lento */}
          <div className="hero-shape absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #FFFFFF 0%, transparent 70%)',
              animation: 'float-slow 12s ease-in-out infinite',
            }}
          />

          {/* Anillo mediano — izquierda */}
          <div className="hero-shape absolute top-1/3 -left-16 w-64 h-64 rounded-full border-2 border-white/25 pointer-events-none"
            style={{ animation: 'float-medium 9s ease-in-out infinite 1s' }}
          />

          {/* Círculo pequeño brillante — arriba derecha */}
          <div className="hero-shape absolute top-16 right-1/4 w-24 h-24 rounded-full opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #FFBDE1 0%, transparent 70%)',
              animation: 'float-fast 7s ease-in-out infinite 0.5s',
            }}
          />

          {/* Anillo grande pulsante — centro abajo */}
          <div className="hero-shape absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/10 pointer-events-none"
            style={{ animation: 'pulse-ring 8s ease-in-out infinite' }}
          />

          {/* Círculo mediano — abajo izquierda */}
          <div className="hero-shape absolute -bottom-8 left-1/4 w-48 h-48 rounded-full opacity-15 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, #C084FC 0%, transparent 70%)',
              animation: 'float-slow 11s ease-in-out infinite 2s',
            }}
          />

          {/* Overlay oscuro muy sutil para legibilidad del texto */}
          <div className="absolute inset-0 bg-black/10" />
        </m.div>
      )}

      {/* Decoraciones flotantes */}
      <HeroDecorations />

      {/* Content */}
      <m.div 
        style={{ y: prefersReducedMotion ? 0 : contentY }}
        className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col items-center"
        initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <m.h1 
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 tracking-tight"
          initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0, ease: [0.22, 1, 0.36, 1] }}
        >
          Belleza que inspira, <br className="hidden sm:block" />
          <span className="text-brand-pink-light">precios que enamoran.</span>
        </m.h1>
        
        <m.p 
          className="font-sans text-lg sm:text-xl text-brand-cream/90 max-w-2xl mx-auto mb-10 font-medium"
          initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          El catálogo más completo de maquillaje, cuidado facial y accesorios. 
          Únete a nuestra red de mayoristas y haz crecer tu negocio.
        </m.p>
        
        <m.div 
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
          initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link 
            href="/catalogo" 
            className="w-full sm:w-auto px-8 py-4 bg-brand-pink text-white rounded-full font-nunito font-bold text-lg hover:bg-brand-pink-dark hover:scale-105 transition-all shadow-lg shadow-brand-pink/30 text-center"
          >
            Ver Catálogo Completo
          </Link>
          <Link 
            href="/mayoristas/login" 
            className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/30 rounded-full font-nunito font-bold text-lg hover:bg-white/20 transition-all text-center"
          >
            Soy Mayorista
          </Link>
        </m.div>
      </m.div>

      {/* Scroll Indicator */}
      {!prefersReducedMotion && (
        <m.div
          style={{ opacity: chevronOpacity }}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <ChevronDown className="w-8 h-8 text-white/80" />
        </m.div>
      )}
    </section>
  );
}
