'use client';

import React, { useState } from 'react';
import { ProductGallery } from './ProductGallery';
import { ProductInfo } from './ProductInfo';
import type { PriceLevel } from '@/lib/auth/carlin-session';
import type { Product, ProductVariant } from '@/types';

interface ProductDetailClientProps {
  product: Product;
  priceLevel: PriceLevel;
}

export function ProductDetailClient({ product, priceLevel }: ProductDetailClientProps) {
  const hasVariants = Boolean(product.variants && product.variants.length > 0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    hasVariants ? product.variants[0] : null
  );

  // Determine images list for gallery:
  // Prepend selected variant image if present and not already in imageUrls
  let galleryImages = [...(product.imageUrls || [])];
  if (selectedVariant?.imageUrl) {
    if (!galleryImages.includes(selectedVariant.imageUrl)) {
      galleryImages = [selectedVariant.imageUrl, ...galleryImages];
    } else {
      // Re-order so selected variant image is first in main viewer
      galleryImages = [
        selectedVariant.imageUrl,
        ...galleryImages.filter((img) => img !== selectedVariant.imageUrl),
      ];
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
      <ProductGallery
        images={galleryImages}
        productName={product.name}
        activeVariantImage={selectedVariant?.imageUrl}
      />

      <ProductInfo
        product={product}
        priceLevel={priceLevel}
        selectedVariant={selectedVariant}
        onSelectVariant={setSelectedVariant}
      />
    </div>
  );
}
