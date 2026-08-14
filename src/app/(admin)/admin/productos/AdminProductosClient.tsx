'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Package, Edit, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';
import { formatCOP } from '@/lib/utils/carlin-pricing';

interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  sku?: string | null;
  retailPrice: any;
  wholesalePrice: any;
  distributorPrice: any;
  stock: number;
  active: boolean;
  imageUrls: string[];
  category: { id: string; name: string };
  brand?: { id: string; name: string } | null;
  variants?: Array<{
    id: string;
    colorName: string;
    colorHex?: string | null;
    imageUrl: string;
    stock: number;
    active: boolean;
    order: number;
  }>;
}

interface AdminProductosClientProps {
  products: AdminProductRow[];
}

export function AdminProductosClient({ products }: AdminProductosClientProps) {
  // Map of expanded product IDs for variant quick preview
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
          <tr>
            <th className="w-10 px-2 py-3"></th>
            <th className="px-4 py-3">Imagen</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Categoría / Marca</th>
            <th className="px-4 py-3">Público</th>
            <th className="px-4 py-3">Mayorista</th>
            <th className="px-4 py-3">Distribuidor</th>
            <th className="px-4 py-3">Stock Total</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((product) => {
            const hasVariants = Boolean(product.variants && product.variants.length > 0);
            const isExpanded = Boolean(expandedIds[product.id]);
            const totalVariantStock = hasVariants
              ? product.variants!.reduce((acc, v) => acc + (v.stock || 0), 0)
              : product.stock;

            return (
              <React.Fragment key={product.id}>
                <tr
                  className={`hover:bg-gray-50/80 transition-colors ${hasVariants ? 'cursor-pointer' : ''}`}
                  onClick={() => hasVariants && toggleExpand(product.id)}
                >
                  <td className="px-2 py-3 text-center">
                    {hasVariants ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(product.id);
                        }}
                        className="p-1 text-gray-400 hover:text-brand-pink-dark rounded-md transition-colors"
                        title={isExpanded ? "Ocultar variantes" : "Ver variantes de color"}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                      {product.imageUrls?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{product.name}</span>
                      {hasVariants && (
                        <span className="text-[10px] font-bold bg-brand-pink-light/30 text-brand-pink-dark px-2 py-0.5 rounded-full">
                          {product.variants!.length} tonos
                        </span>
                      )}
                    </div>
                    {product.sku && <div className="text-xs text-gray-500 font-normal">SKU: {product.sku}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{product.category?.name || 'Sin categoría'}</div>
                    {product.brand && <div className="text-xs text-gray-400">{product.brand.name}</div>}
                  </td>
                  <td className="px-4 py-3">{formatCOP(Number(product.retailPrice))}</td>
                  <td className="px-4 py-3 font-medium text-brand-pink-dark">{formatCOP(Number(product.wholesalePrice))}</td>
                  <td className="px-4 py-3 font-medium text-brand-distributor-dark">{formatCOP(Number(product.distributorPrice))}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">{totalVariantStock}</span>
                    {hasVariants && <span className="text-xs text-gray-500 block">(en variantes)</span>}
                  </td>
                  <td className="px-4 py-3">
                    {product.active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/productos/${product.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <DeleteProductButton
                        productId={product.id}
                        productName={product.name}
                        isActive={product.active}
                      />
                    </div>
                  </td>
                </tr>

                {/* Expanded Variant Stock Preview Row */}
                {hasVariants && isExpanded && (
                  <tr className="bg-brand-pink-light/10 border-b border-brand-pink-light/20">
                    <td colSpan={10} className="p-4 pl-14">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-pink-dark flex items-center gap-2">
                          Variantes de Color & Stock en Inventario:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                          {product.variants!.map((variant) => (
                            <div
                              key={variant.id}
                              className="flex items-center gap-3 p-2.5 bg-white border border-brand-pink-light/30 rounded-xl shadow-2xs"
                            >
                              <span
                                className="w-5 h-5 rounded-full border border-black/20 shrink-0 shadow-inner"
                                style={{ backgroundColor: variant.colorHex || '#F0A0C6' }}
                              />
                              <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={variant.imageUrl} alt={variant.colorName} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0 flex-1 text-xs">
                                <p className="font-bold text-gray-900 truncate">
                                  • {variant.colorName}
                                </p>
                                <p className="text-gray-500">
                                  Stock: <strong className="text-brand-pink-dark font-bold">{variant.stock}</strong> disponibles
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
