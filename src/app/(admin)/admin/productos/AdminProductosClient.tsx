'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Package, Edit, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
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
  const router = useRouter();
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleActive = async (product: AdminProductRow, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (togglingId === product.id) return;

    const ok = confirm(
      product.active
        ? `¿Desactivar "${product.name}"?\n\n` +
          'El producto dejará de verse en la tienda pública y catálogo.\n' +
          'Podrás reactivarlo en cualquier momento haciendo clic en "Inactivo" o editándolo.'
        : `¿Activar "${product.name}"?\n\n` +
          'El producto volverá a mostrarse en la tienda pública y en el catálogo para todos tus clientes.'
    );
    if (!ok) return;

    setTogglingId(product.id);
    try {
      const res = await fetch(`/api/admin/productos/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active }),
      });

      if (res.ok) {
        router.refresh();
        return;
      }

      const data = await res.json().catch(() => null);
      alert(data?.error ?? `No se pudo cambiar el estado del producto (error ${res.status}).`);
    } catch {
      alert('Error de conexión al cambiar el estado del producto.');
    } finally {
      setTogglingId(null);
    }
  };

  const StatusPill = ({ product }: { product: AdminProductRow }) => {
    const isBusy = togglingId === product.id;

    if (product.active) {
      return (
        <button
          type="button"
          onClick={(e) => handleToggleActive(product, e)}
          disabled={isBusy}
          title="Producto activo en la tienda. Haz clic para desactivarlo."
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-800 hover:bg-green-200 transition-colors cursor-pointer disabled:opacity-50"
        >
          {isBusy ? <Loader2 size={10} className="animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-green-600" />}
          Activo
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={(e) => handleToggleActive(product, e)}
        disabled={isBusy}
        title="Producto inactivo (oculto en tienda). Haz clic para activarlo."
        className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer border border-gray-300 disabled:opacity-50"
      >
        {isBusy ? <Loader2 size={10} className="animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
        Inactivo
      </button>
    );
  };

  return (
    <div className="w-full">
      {/* Mobile Card List (visible < md) */}
      <div className="block md:hidden space-y-3">
        {products.map((product) => {
          const hasVariants = Boolean(product.variants && product.variants.length > 0);
          const isExpanded = Boolean(expandedIds[product.id]);
          const totalVariantStock = hasVariants
            ? product.variants!.reduce((acc, v) => acc + (v.stock || 0), 0)
            : product.stock;

          return (
            <div
              key={product.id}
              className={`bg-white rounded-2xl p-4 border border-gray-200 shadow-xs space-y-3 transition-opacity ${product.active ? '' : 'opacity-70 bg-gray-50/50'}`}
            >
              {/* Top row: Image + Info + Status */}
              <div className="flex gap-3 items-start">
                <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                  {product.imageUrls?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package size={24} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    <StatusPill product={product} />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-gray-500">
                    <span className="font-medium text-gray-700">{product.category?.name || 'Sin categoría'}</span>
                    {product.brand && <span>• {product.brand.name}</span>}
                    {product.sku && <span>• SKU: {product.sku}</span>}
                  </div>
                </div>
              </div>

              {/* Price Grid (3 cols on mobile) */}
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-xl text-center">
                <div>
                  <span className="block text-[10px] text-gray-500 font-medium">Público</span>
                  <span className="text-xs font-bold text-gray-900">{formatCOP(Number(product.retailPrice))}</span>
                </div>
                <div className="border-x border-gray-200">
                  <span className="block text-[10px] text-brand-pink-dark font-medium">Mayorista</span>
                  <span className="text-xs font-bold text-brand-pink-dark">{formatCOP(Number(product.wholesalePrice))}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brand-distributor-dark font-medium">Distribuidor</span>
                  <span className="text-xs font-bold text-brand-distributor-dark">{formatCOP(Number(product.distributorPrice))}</span>
                </div>
              </div>

              {/* Stock info & Variant Toggle */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100">
                <div className="text-gray-600 font-medium">
                  Stock: <strong className="text-gray-900 font-bold">{totalVariantStock}</strong> {hasVariants ? `(en ${product.variants!.length} tonos)` : 'unidades'}
                </div>

                {hasVariants && (
                  <button
                    type="button"
                    onClick={() => toggleExpand(product.id)}
                    className="flex items-center gap-1 text-xs font-bold text-brand-pink-dark hover:underline p-1"
                  >
                    <span>{isExpanded ? 'Ocultar tonos' : 'Ver tonos'}</span>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
              </div>

              {/* Expandable Variants for Mobile */}
              {hasVariants && isExpanded && (
                <div className="pt-2 border-t border-brand-pink-light/30 space-y-2 bg-brand-pink-light/10 p-2.5 rounded-xl">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-brand-pink-dark">
                    Tonos & Stock:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {product.variants!.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-brand-pink-light/30 text-xs"
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-inner"
                          style={{ backgroundColor: variant.colorHex || '#F0A0C6' }}
                        />
                        <div className="w-7 h-7 rounded-md overflow-hidden border border-gray-200 shrink-0 bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={variant.imageUrl} alt={variant.colorName} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-gray-900 flex-1 truncate">{variant.colorName}</span>
                        <span className="text-gray-500 font-medium">Stock: <strong className="text-brand-pink-dark">{variant.stock}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Link href={`/admin/productos/${product.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full h-9 text-xs font-semibold gap-1 text-blue-600 border-blue-200 hover:bg-blue-50">
                    <Edit size={14} /> Editar
                  </Button>
                </Link>
                <div className="flex-1">
                  <DeleteProductButton
                    productId={product.id}
                    productName={product.name}
                    isActive={product.active}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {products.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-gray-200">
            No hay productos registrados.
          </div>
        )}
      </div>

      {/* Desktop Table View (visible >= md) */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
                      className={`hover:bg-gray-50/80 transition-colors ${hasVariants ? 'cursor-pointer' : ''} ${product.active ? '' : 'opacity-70 bg-gray-50/40'}`}
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
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <StatusPill product={product} />
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/productos/${product.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Editar producto">
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
              {products.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No hay productos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
