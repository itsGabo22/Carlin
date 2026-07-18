import React from 'react';
import { formatCOP, getEffectivePrice, getStrikethroughPrice } from '@/lib/utils/carlin-pricing';
import { cn } from '@/lib/utils';
import type { PriceLevel } from '@/lib/auth/carlin-session';
import type { Product } from '@/types';

interface PriceDisplayProps {
  product: Product;
  priceLevel: PriceLevel;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceDisplay({ product, priceLevel, className, size = 'md' }: PriceDisplayProps) {
  const roleMap: Record<PriceLevel, any> = {
    retail: null,
    wholesale: 'MAYORISTA',
    distributor: 'DISTRIBUIDOR',
  };

  const userRole = roleMap[priceLevel];
  const effectivePrice = getEffectivePrice(product as any, userRole);
  const strikePrice = getStrikethroughPrice(product as any, userRole);

  const priceColor = 
    priceLevel === 'wholesale' ? 'text-brand-pink-dark' :
    priceLevel === 'distributor' ? 'text-brand-distributor' :
    'text-gray-900';

  const labelText = 
    priceLevel === 'wholesale' ? 'Precio mayorista' :
    priceLevel === 'distributor' ? 'Precio distribuidor' :
    null;

  const sizeClasses = {
    sm: { price: 'text-lg font-bold', strike: 'text-sm', label: 'text-xs' },
    md: { price: 'text-xl font-bold', strike: 'text-sm', label: 'text-xs' },
    lg: { price: 'text-2xl font-bold', strike: 'text-base', label: 'text-sm' },
  };

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-end gap-2 flex-wrap">
        <span className={cn(sizeClasses[size].price, priceColor)}>
          {formatCOP(effectivePrice as number)}
        </span>
        {strikePrice && (
          <span className={cn(sizeClasses[size].strike, 'text-gray-400 line-through mb-1')}>
            {formatCOP(strikePrice as number)}
          </span>
        )}
      </div>
      {labelText && (
        <span className={cn(sizeClasses[size].label, priceColor, 'opacity-90 font-medium')}>
          {labelText}
        </span>
      )}
    </div>
  );
}
