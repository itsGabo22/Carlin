'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PriceDisplay } from './PriceDisplay';
import { cn } from '@/lib/utils';
import type { PriceLevel } from '@/lib/auth/carlin-session';
import type { Product } from '@/types';
import { ImageIcon } from 'lucide-react';

export interface ProductCardProps {
  product: Product;
  priceLevel: PriceLevel;
  isPriority?: boolean;
  className?: string;
}

export function ProductCard({ product, priceLevel, isPriority, className }: ProductCardProps) {
  const imageUrl = product.imageUrls?.[0];
  const isOutOfStock = product.stock <= 0;

  return (
    <Link 
      href={`/producto/${product.slug}`}
      className={cn(
        "group relative flex flex-col bg-white rounded-2xl overflow-hidden",
        "border border-transparent",
        "transition-all duration-300",
        "hover:border-brand-pink/40",
        "hover:shadow-[0_8px_30px_rgba(251,156,208,0.25)]",
        className
      )}
      aria-label={`Ver detalles de ${product.name}`}
    >
      {/* Imagen */}
      <div className="relative aspect-square w-full bg-brand-cream overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            priority={isPriority}
            unoptimized={true}
            className="object-contain p-2 transition-transform duration-500 ease-out group-hover:scale-108"
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon className="w-12 h-12 opacity-50" />
          </div>
        )}

        {/* Overlay Agotado */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-500 text-white scale-110 shadow-lg">AGOTADO</span>
          </div>
        )}

        {/* Badges de Tags */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {product.tags?.slice(0, 2).map((tag, i) => (
            <span 
              key={tag.id || i} 
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-white/90 text-brand-pink-dark shadow-sm border-none"
            >
              {tag.name}
            </span>
          ))}
        </div>

        {/* Botón Ver Producto */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10">
          <button className="w-full bg-brand-pink text-white text-sm font-sans font-semibold py-2 rounded-xl hover:bg-brand-pink-dark transition-colors">
            Ver producto
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 relative z-20 bg-white">
        {product.brand && (
          <span className="text-[10px] sm:text-xs uppercase font-bold tracking-wider text-brand-pink-dark/70 mb-1">
            {product.brand.name}
          </span>
        )}
        
        <h3 className="font-nunito font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 mb-2 flex-1">
          {product.name}
        </h3>

        <div className="flex flex-col mt-auto pt-2 border-t border-gray-50 gap-1">
          {product.tones && product.tones.length > 0 && (
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-pink flex-shrink-0" />
              {product.tones.length} tonos
            </p>
          )}
          {product.unit && (
            <span className="text-[11px] text-gray-500">
              {product.unit}
            </span>
          )}
          
          <div className="mt-1">
            <PriceDisplay product={product} priceLevel={priceLevel} size="sm" />
          </div>
        </div>
      </div>

      {/* Borde Inferior Animado */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-pink scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left z-30" />
    </Link>
  );
}
