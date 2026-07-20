'use client';

import * as React from 'react';
import Link from 'next/link';
import { m, useReducedMotion } from 'framer-motion';

export function WholesaleBanner() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <m.section
      initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="py-16 px-4 md:px-8"
    >
      <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl">
        {/* Fondo */}
        <div 
          className="absolute inset-0 -z-20"
          style={{ background: 'linear-gradient(135deg, #E05FA0 0%, #C084FC 100%)' }}
        />
        {/* Patrón de puntos */}
        <div 
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        <div className="relative z-10 px-6 py-12 md:py-20 text-center flex flex-col items-center">
          <h2 className="font-serif text-3xl md:text-5xl font-bold text-white mb-6">
            Crece con Carlin
          </h2>
          <p className="font-sans text-white/90 text-lg max-w-2xl mx-auto mb-10">
            Únete a nuestra red exclusiva de compras al por mayor y obtén márgenes de ganancia increíbles con las mejores marcas de belleza.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-5 border border-white/20 text-center min-w-[200px]">
              <p className="text-3xl font-bold text-white">$200.000</p>
              <p className="text-xs text-white/70 uppercase tracking-wider mt-1">
                Mayorista
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-5 border border-white/20 text-center min-w-[200px]">
              <p className="text-3xl font-bold text-white">$400.000</p>
              <p className="text-xs text-white/70 uppercase tracking-wider mt-1">
                Distribuidor
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <m.div
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Link 
                href="/registro-mayorista" 
                className="block px-8 py-4 bg-white text-brand-pink-dark rounded-full font-nunito font-bold text-lg hover:bg-brand-cream transition-colors shadow-lg"
              >
                Ser Mayorista
              </Link>
            </m.div>
            
            <m.div
              whileHover={prefersReducedMotion ? {} : { scale: 1.05 }}
              whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Link 
                href="/mayoristas/login" 
                className="block px-8 py-4 bg-transparent text-white border-2 border-white rounded-full font-nunito font-bold text-lg hover:bg-white/10 transition-colors"
              >
                Iniciar Sesión
              </Link>
            </m.div>
          </div>
        </div>
      </div>
    </m.section>
  );
}
