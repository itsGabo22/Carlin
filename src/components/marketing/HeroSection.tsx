'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { m, AnimatePresence, useReducedMotion, useTransform } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePageScroll } from '@/hooks/usePageScroll';
import HeroDecorations from './HeroDecorations';

export function HeroSection({ slides = [] }: { slides?: any[] }) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [mediaError, setMediaError] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const prefersReducedMotion = useReducedMotion();
  const scrollY = usePageScroll();

  const shapesY = useTransform(scrollY, [0, 600], [0, -80]);
  const contentY = useTransform(scrollY, [0, 600], [0, -40]);
  const chevronOpacity = useTransform(scrollY, [0, 100], [1, 0]);

  const hasSlides = slides.length > 0;

  // Auto-play interval
  React.useEffect(() => {
    if (!hasSlides || slides.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [hasSlides, slides.length, isPaused]);

  const nextSlide = () => setCurrentSlide(c => (c + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(c => (c - 1 + slides.length) % slides.length);

  // Swipe logic
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    if (diff > 50) {
      nextSlide();
      setTouchStart(null);
    }
    if (diff < -50) {
      prevSlide();
      setTouchStart(null);
    }
  };

  const onTouchEnd = () => {
    setTouchStart(null);
    setIsPaused(false);
  };

  return (
    <section 
      className="relative w-full h-[85vh] sm:h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-brand-pink-dark group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Slides */}
      {!hasSlides || mediaError ? (
        <m.div style={{ y: prefersReducedMotion ? 0 : shapesY }} className="absolute inset-0 overflow-hidden -z-20">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #FFC8E3 0%, #FB9CD0 40%, #E05FA0 75%, #B5179E 100%)' }} />
          <div className="hero-shape absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #FFFFFF 0%, transparent 70%)', animation: 'float-slow 12s ease-in-out infinite' }} />
          <div className="hero-shape absolute top-1/3 -left-16 w-64 h-64 rounded-full border-2 border-white/25 pointer-events-none" style={{ animation: 'float-medium 9s ease-in-out infinite 1s' }} />
          <div className="hero-shape absolute top-16 right-1/4 w-24 h-24 rounded-full opacity-30 pointer-events-none" style={{ background: 'radial-gradient(circle, #FFBDE1 0%, transparent 70%)', animation: 'float-fast 7s ease-in-out infinite 0.5s' }} />
          <div className="hero-shape absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/10 pointer-events-none" style={{ animation: 'pulse-ring 8s ease-in-out infinite' }} />
          <div className="hero-shape absolute -bottom-8 left-1/4 w-48 h-48 rounded-full opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #C084FC 0%, transparent 70%)', animation: 'float-slow 11s ease-in-out infinite 2s' }} />
          <div className="absolute inset-0 bg-black/10" />
        </m.div>
      ) : (
        <AnimatePresence initial={false}>
          <m.div 
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full -z-20"
          >
            {slides[currentSlide].type === 'VIDEO' ? (
              <video 
                autoPlay 
                loop 
                muted 
                playsInline 
                className="w-full h-full object-cover"
                onError={() => setMediaError(true)}
              >
                <source src={slides[currentSlide].desktopUrl} />
              </video>
            ) : (
              <>
                <picture>
                  {slides[currentSlide].mobileUrl && (
                    <source media="(max-width: 768px)" srcSet={slides[currentSlide].mobileUrl} />
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={slides[currentSlide].desktopUrl} 
                    alt={slides[currentSlide].title || 'Hero Slide'} 
                    className="w-full h-full object-cover"
                    onError={() => setMediaError(true)}
                  />
                </picture>
              </>
            )}
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
          </m.div>
        </AnimatePresence>
      )}

      {/* Floating Decorations */}
      <HeroDecorations />

      {/* Content */}
      <AnimatePresence mode="wait">
        <m.div 
          key={currentSlide}
          style={{ y: prefersReducedMotion ? 0 : contentY }}
          className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col items-center"
          initial={{ opacity: prefersReducedMotion ? 1 : 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 tracking-tight drop-shadow-lg">
            {hasSlides && slides[currentSlide].title ? (
              slides[currentSlide].title
            ) : (
              <>Belleza que inspira, <br className="hidden sm:block" /><span className="text-brand-pink-light">precios que enamoran.</span></>
            )}
          </h1>
          
          <p className="font-sans text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10 font-medium drop-shadow-md">
            {hasSlides && slides[currentSlide].subtitle ? (
              slides[currentSlide].subtitle
            ) : (
              'El catálogo más completo de maquillaje, cuidado facial y accesorios. Únete a nuestra red de mayoristas y haz crecer tu negocio.'
            )}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {hasSlides && slides[currentSlide].ctaText ? (
              <Link 
                href={slides[currentSlide].ctaHref || '/catalogo'}
                className="w-full sm:w-auto px-8 py-4 bg-brand-pink text-white rounded-full font-nunito font-bold text-lg hover:bg-brand-pink-dark hover:scale-105 transition-all shadow-lg shadow-brand-pink/30 text-center"
              >
                {slides[currentSlide].ctaText}
              </Link>
            ) : (
              <>
                <Link href="/catalogo" className="w-full sm:w-auto px-8 py-4 bg-brand-pink text-white rounded-full font-nunito font-bold text-lg hover:bg-brand-pink-dark hover:scale-105 transition-all shadow-lg shadow-brand-pink/30 text-center">
                  Ver Catálogo Completo
                </Link>
                <Link href="/mayoristas/login" className="w-full sm:w-auto px-8 py-4 bg-white/20 backdrop-blur-md text-white border border-white/40 rounded-full font-nunito font-bold text-lg hover:bg-white/30 transition-all text-center">
                  Soy Mayorista
                </Link>
              </>
            )}
          </div>
        </m.div>
      </AnimatePresence>

      {/* Manual Controls */}
      {hasSlides && slides.length > 1 && !prefersReducedMotion && (
        <>
          <button 
            onClick={prevSlide} 
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={32} />
          </button>
          
          <button 
            onClick={nextSlide} 
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={32} />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, idx) => (
              <button 
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Scroll Indicator */}
      {!prefersReducedMotion && (
        <m.div
          style={{ opacity: chevronOpacity }}
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10"
        >
          <ChevronDown className="w-6 h-6 text-white/70" />
        </m.div>
      )}
    </section>
  );
}
