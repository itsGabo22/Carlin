'use client';

import * as React from 'react';
import { ShoppingBag, Minus, Plus, Check } from 'lucide-react';
import { PriceDisplay } from '@/components/catalog/PriceDisplay';
import { useCartStore } from '@/stores/cartStore';
import { getEffectivePrice } from '@/lib/utils/carlin-pricing';
import type { PriceLevel } from '@/lib/auth/carlin-session';
import type { Product, ProductVariant } from '@/types';
import { cn } from '@/lib/utils';

export interface ProductInfoProps {
  product: Product;
  priceLevel: PriceLevel;
  selectedVariant?: ProductVariant | null;
  onSelectVariant?: (variant: ProductVariant) => void;
}

const ROLE_MAP: Record<PriceLevel, 'MAYORISTA' | 'DISTRIBUIDOR' | null> = {
  retail: null,
  wholesale: 'MAYORISTA',
  distributor: 'DISTRIBUIDOR',
};

export function ProductInfo({
  product,
  priceLevel,
  selectedVariant,
  onSelectVariant,
}: ProductInfoProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [added, setAdded] = React.useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const hasVariants = Boolean(product.variants && product.variants.length > 0);

  // If variants exist, effective stock is selected variant's stock. Otherwise fallback to product stock.
  const activeStock = hasVariants
    ? (selectedVariant?.stock ?? 0)
    : product.stock;

  const isOutOfStock = activeStock <= 0;
  const effectivePrice = Number(getEffectivePrice(product, ROLE_MAP[priceLevel]));

  // Reset quantity if stock changes below current quantity
  React.useEffect(() => {
    if (quantity > activeStock && activeStock > 0) {
      setQuantity(activeStock);
    }
  }, [activeStock, quantity]);

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      variantId: selectedVariant?.id || null,
      colorName: selectedVariant?.colorName || null,
      colorHex: selectedVariant?.colorHex || null,
      name: product.name,
      price: effectivePrice,
      imageUrl: selectedVariant?.imageUrl || product.imageUrls?.[0],
      maxStock: activeStock,
      quantity,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-5 bg-white p-6 sm:p-8 rounded-2xl border border-brand-pink-light/20 shadow-sm">
      {/* Brand & Category Label */}
      <div className="flex items-center gap-2">
        {product.brand && (
          <span className="text-xs uppercase font-bold tracking-widest text-brand-pink-dark/80 bg-brand-pink-light/30 px-2.5 py-1 rounded-full">
            {product.brand.name}
          </span>
        )}
        {product.category && (
          <span className="text-xs text-gray-500 font-sans font-medium">
            {product.category.name}
          </span>
        )}
      </div>

      {/* Product Title (Cormorant Garamond soft luxury header) */}
      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
        {product.name}
      </h1>

      {/* Price Display */}
      <PriceDisplay product={product} priceLevel={priceLevel} size="lg" />

      {/* Color Swatch Selector (if variants exist) */}
      {hasVariants && product.variants && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-800">
              Color / Tono: <strong className="text-brand-pink-dark font-bold">{selectedVariant?.colorName || 'Selecciona'}</strong>
            </span>
            <span className="text-xs font-medium text-gray-500">
              {activeStock > 0 ? `${activeStock} disponibles` : 'Agotado en este tono'}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {product.variants.map((v) => {
              const isSelected = selectedVariant?.id === v.id;
              const isVariantOut = v.stock <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectVariant && onSelectVariant(v)}
                  className={cn(
                    'group relative flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all text-xs font-semibold',
                    isSelected
                      ? 'border-brand-pink bg-brand-pink-light/20 text-brand-pink-dark shadow-sm ring-2 ring-brand-pink/20'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-brand-pink-light/80 hover:bg-gray-50',
                    isVariantOut && 'opacity-60',
                  )}
                  title={`${v.colorName} (${v.stock} disponibles)`}
                >
                  <span
                    className="w-6 h-6 rounded-full border border-black/15 shadow-inner shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: v.colorHex || '#F0A0C6' }}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
                    )}
                  </span>
                  <span>{v.colorName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legacy Tones list (if 0 variants but product has tones array) */}
      {!hasVariants && product.tones && product.tones.length > 0 && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-2">Tonos sugeridos</p>
          <div className="flex flex-wrap gap-2">
            {product.tones.map((tone) => (
              <span key={tone} className="px-3 py-1 rounded-full bg-brand-pink-light/30 text-xs text-brand-pink-dark font-medium">
                {tone}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {product.description && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-gray-600 leading-relaxed text-sm">{product.description}</p>
        </div>
      )}

      {/* Presentation */}
      {product.unit && (
        <p className="text-xs text-gray-500">Presentación: <span className="font-semibold text-gray-700">{product.unit}</span></p>
      )}

      {/* Add to Cart Controls */}
      <div className="pt-4 border-t border-gray-100 space-y-3">
        {isOutOfStock ? (
          <div className="w-full py-3.5 border border-gray-200 bg-gray-50/50 text-gray-400 rounded-xl text-center font-medium text-sm">
            {hasVariants ? `Agotado en tono ${selectedVariant?.colorName || ''}` : 'Producto Agotado'}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50/50">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="p-3 text-gray-500 hover:text-brand-pink-dark transition-colors disabled:opacity-40"
                aria-label="Disminuir cantidad"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(activeStock, q + 1))}
                disabled={quantity >= activeStock}
                className="p-3 text-gray-500 hover:text-brand-pink-dark transition-colors disabled:opacity-40"
                aria-label="Aumentar cantidad"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-pink hover:bg-brand-pink-dark text-white font-sans font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <ShoppingBag className="w-5 h-5" />
              {added
                ? '¡Agregado al carrito!'
                : selectedVariant
                  ? `Agregar (${selectedVariant.colorName})`
                  : 'Agregar al carrito'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
