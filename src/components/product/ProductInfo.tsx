'use client';

import * as React from 'react';
import { ShoppingBag, Minus, Plus } from 'lucide-react';
import { PriceDisplay } from '@/components/catalog/PriceDisplay';
import { useCartStore } from '@/stores/cartStore';
import { getEffectivePrice } from '@/lib/utils/carlin-pricing';
import type { PriceLevel } from '@/lib/auth/carlin-session';
import type { Product } from '@/types';

export interface ProductInfoProps {
  product: Product;
  priceLevel: PriceLevel;
}

const ROLE_MAP: Record<PriceLevel, 'MAYORISTA' | 'DISTRIBUIDOR' | null> = {
  retail: null,
  wholesale: 'MAYORISTA',
  distributor: 'DISTRIBUIDOR',
};

export function ProductInfo({ product, priceLevel }: ProductInfoProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const isOutOfStock = product.stock <= 0;
  const effectivePrice = Number(getEffectivePrice(product, ROLE_MAP[priceLevel]));

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      imageUrl: product.imageUrls?.[0],
      maxStock: product.stock,
      quantity,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      {product.brand && (
        <span className="text-xs uppercase font-bold tracking-wider text-brand-pink-dark/70">
          {product.brand.name}
        </span>
      )}

      <h1 className="font-nunito text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>

      <PriceDisplay product={product} priceLevel={priceLevel} size="lg" />

      {product.tones.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Tonos disponibles</p>
          <div className="flex flex-wrap gap-2">
            {product.tones.map((tone) => (
              <span key={tone} className="px-3 py-1 rounded-full bg-brand-pink-light/30 text-xs text-brand-pink-dark">
                {tone}
              </span>
            ))}
          </div>
        </div>
      )}

      {product.description && (
        <p className="text-gray-600 leading-relaxed">{product.description}</p>
      )}

      {product.unit && (
        <p className="text-sm text-gray-500">Presentación: {product.unit}</p>
      )}

      {isOutOfStock ? (
        <span className="inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold bg-red-100 text-red-600">
          Agotado
        </span>
      ) : (
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center border border-gray-200 rounded-xl">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2 text-gray-500 hover:text-brand-pink-dark transition-colors"
              aria-label="Disminuir cantidad"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-semibold">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="p-2 text-gray-500 hover:text-brand-pink-dark transition-colors"
              aria-label="Aumentar cantidad"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-pink hover:bg-brand-pink-dark text-white font-nunito font-bold py-3 rounded-xl transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            {added ? '¡Agregado!' : 'Agregar al carrito'}
          </button>
        </div>
      )}
    </div>
  );
}
