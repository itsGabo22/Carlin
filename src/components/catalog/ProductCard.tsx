'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ImageIcon, Check, ShoppingBag } from 'lucide-react';
import { PriceDisplay } from './PriceDisplay';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { getEffectivePrice } from '@/lib/utils/carlin-pricing';
import type { PriceLevel } from '@/lib/auth/carlin-session';
import type { Product } from '@/types';

export interface ProductCardProps {
  product: Product;
  priceLevel: PriceLevel;
  isPriority?: boolean;
  className?: string;
}

/** Mismo mapeo que usa ProductInfo para resolver el precio del nivel. */
const ROLE_MAP: Record<PriceLevel, any> = {
  retail: null,
  wholesale: 'MAYORISTA',
  distributor: 'DISTRIBUIDOR',
};

/**
 * Tarjeta de producto del catálogo. Se usa en TODAS las grillas
 * (categoría, subcategoría, búsqueda, marca y secciones de la home).
 *
 * Estructura tomada de la referencia Bloomshell: imagen cuadrada, franja con
 * la marca sobre la imagen, nombre en mayúsculas centrado, precio y botón
 * "Añadir al Carrito" siempre visible.
 *
 * Ojo: en Bloomshell esa franja viene quemada dentro de la foto del producto.
 * Acá es un elemento real alimentado por el modelo Brand, así que solo aparece
 * cuando el producto tiene marca asignada.
 */
export function ProductCard({ product, priceLevel, isPriority, className }: ProductCardProps) {
  const reduceMotion = useReducedMotion();
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = React.useState(false);

  const imageUrl = product.imageUrls?.[0];
  const hoverImageUrl = product.imageUrls?.[1];
  const isOutOfStock = product.stock <= 0;
  const effectivePrice = Number(getEffectivePrice(product as any, ROLE_MAP[priceLevel]));

  const handleAddToCart = (e: React.MouseEvent) => {
    // La tarjeta entera es un <Link>: sin esto, añadir al carrito navegaría.
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      imageUrl: product.imageUrls?.[0],
      maxStock: product.stock,
      quantity: 1,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={cn('group h-full', className)}
    >
      <Link
        href={`/producto/${product.slug}`}
        className={cn(
          'relative flex h-full flex-col overflow-hidden rounded-2xl bg-white',
          'border border-brand-cream',
          'transition-shadow duration-300',
          'hover:shadow-[0_14px_40px_-12px_rgba(240,160,198,0.45)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink focus-visible:ring-offset-2',
        )}
        aria-label={`Ver detalles de ${product.name}`}
      >
        {/* ── Imagen ─────────────────────────────────────────── */}
        <div className="relative aspect-square w-full overflow-hidden bg-brand-cream/40">
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                priority={isPriority}
                unoptimized
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className={cn(
                  'object-cover object-top p-0 transition-all duration-500 ease-out',
                  !reduceMotion && 'group-hover:scale-[1.06]',
                  // Si hay segunda imagen, la primera se desvanece al pasar el mouse.
                  hoverImageUrl && !reduceMotion && 'group-hover:opacity-0',
                )}
              />
              {hoverImageUrl && !reduceMotion && (
                <Image
                  src={hoverImageUrl}
                  alt=""
                  aria-hidden
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="object-cover object-top p-0 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-brand-pink/30">
              <ImageIcon className="h-12 w-12" />
            </div>
          )}

          {/* Franja de marca sobre la imagen (referencia Bloomshell) */}
          {product.brand && (
            <div className="absolute inset-x-0 bottom-0 z-10 bg-brand-pink-dark/85 px-3 py-1.5 backdrop-blur-[2px]">
              <p className="truncate text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                {product.brand.name}
              </p>
            </div>
          )}

          {/* Etiquetas */}
          <div className="absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
            {product.tags?.slice(0, 2).map((tag, i) => (
              <span
                key={tag.id || i}
                className="rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-brand-pink-dark shadow-sm"
              >
                {tag.name}
              </span>
            ))}
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/65 backdrop-blur-[1px]">
              <span className="rounded-full bg-brand-neutral-dark px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg">
                Agotado
              </span>
            </div>
          )}
        </div>

        {/* ── Info ───────────────────────────────────────────── */}
        <div className="flex flex-1 flex-col items-center gap-2 px-4 pb-4 pt-4 text-center">
          <h3 className="line-clamp-2 text-sm font-medium uppercase leading-snug tracking-wide text-brand-neutral-dark">
            {product.name}
          </h3>

          {product.tones && product.tones.length > 0 && (
            <p className="flex items-center gap-1 text-[11px] text-brand-text/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-pink" />
              {product.tones.length} tonos
            </p>
          )}

          <div className="mt-auto flex w-full flex-col items-center gap-3 pt-1">
            <PriceDisplay product={product} priceLevel={priceLevel} size="sm" className="items-center" />

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              aria-label={`Añadir ${product.name} al carrito`}
              className={cn(
                'flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2.5',
                'text-[13px] font-bold uppercase tracking-[1px] text-white',
                'transition-all duration-200 active:scale-[0.98]',
                isOutOfStock
                  ? 'cursor-not-allowed bg-brand-neutral-200 text-brand-neutral-500'
                  : added
                    ? 'bg-emerald-500'
                    : 'bg-brand-pink hover:bg-brand-pink-dark',
              )}
            >
              {isOutOfStock ? (
                'Sin stock'
              ) : added ? (
                <>
                  <Check size={15} /> Añadido
                </>
              ) : (
                <>
                  <ShoppingBag size={15} /> Añadir al Carrito
                </>
              )}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
