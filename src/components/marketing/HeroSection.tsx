'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { SiteConfig } from '@prisma/client';

export function HeroSection({ config }: { config: SiteConfig | null }) {
  const useVideo = config?.heroUseVideo ?? false;
  
  const storageBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hero-media/hero` 
    : '';

  const heroVideoDesktopUrl = `${storageBaseUrl}/video.webm`;
  // Fallback to mp4 if webm is not the uploaded format. We will use a standard source tag.
  const heroVideoDesktopUrlMp4 = `${storageBaseUrl}/video.mp4`;
  
  const heroImageDesktopUrl = `${storageBaseUrl}/desktop.webp`;
  const heroImageMobileUrl = `${storageBaseUrl}/mobile.webp`;

  return (
    <section className="relative w-full h-[85vh] sm:h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full -z-20 bg-gradient-to-tr from-brand-text to-brand-pink-dark">
        {useVideo && storageBaseUrl ? (
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover"
          >
            {/* The prompt says desktop vs mobile video, but the UI only uploads one 'video'. We'll use it for both. */}
            <source src={heroVideoDesktopUrl} type="video/webm" />
            <source src={heroVideoDesktopUrlMp4} type="video/mp4" />
          </video>
        ) : storageBaseUrl ? (
          <>
            <div className="hidden md:block w-full h-full relative">
              <Image 
                src={heroImageDesktopUrl} 
                alt="Carlin Hero" 
                fill 
                className="object-cover"
                priority 
                unoptimized 
              />
            </div>
            <div className="block md:hidden w-full h-full relative">
              <Image 
                src={heroImageMobileUrl} 
                alt="Carlin Hero Mobile" 
                fill 
                className="object-cover"
                priority 
                unoptimized 
              />
            </div>
          </>
        ) : null}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-brand-text/55 -z-10" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col items-center">
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 tracking-tight">
          Belleza que inspira, <br className="hidden sm:block" />
          <span className="text-brand-pink-light">precios que enamoran.</span>
        </h1>
        
        <p className="font-sans text-lg sm:text-xl text-brand-cream/90 max-w-2xl mx-auto mb-10 font-medium">
          El catálogo más completo de maquillaje, cuidado facial y accesorios. 
          Únete a nuestra red de mayoristas y haz crecer tu negocio.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
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
        </div>
      </div>
    </section>
  );
}
