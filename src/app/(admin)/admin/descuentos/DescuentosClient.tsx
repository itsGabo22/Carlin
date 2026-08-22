'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Search, CheckSquare, Square, Percent, Tag, Users, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DiscountAudience = 'ALL' | 'WHOLESALE' | 'DISTRIBUTOR';
type DiscountScope = 'GLOBAL' | 'CATEGORY' | 'PRODUCT';

export function DescuentosClient({ initialDiscounts, products, categories }: { 
  initialDiscounts: any[], 
  products: any[], 
  categories: any[] 
}) {
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<any>(null);
  const [productSearch, setProductSearch] = useState('');
  
  const [formData, setFormData] = useState({
    label: '',
    couponCode: '',
    percentage: 0,
    scope: 'GLOBAL' as DiscountScope,
    audience: 'ALL' as DiscountAudience,
    productIds: [] as string[],
    categoryId: '',
    startsAt: '',
    endsAt: '',
    active: true,
  });

  const toDateInputValue = (value: string | Date | null) =>
    value ? new Date(value).toISOString().slice(0, 10) : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingDiscount 
      ? `/api/admin/descuentos/${editingDiscount.id}`
      : '/api/admin/descuentos';
    const method = editingDiscount ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        couponCode: formData.couponCode.trim() || null,
        productIds: formData.scope === 'PRODUCT' ? formData.productIds : [],
        categoryId: formData.scope === 'CATEGORY' ? formData.categoryId : null,
        startsAt: formData.startsAt || null,
        endsAt: formData.endsAt || null,
      })
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert('Error guardando descuento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar descuento?')) return;
    const res = await fetch(`/api/admin/descuentos/${id}`, { method: 'DELETE' });
    if (res.ok) window.location.reload();
  };

  const openModal = (discount?: any) => {
    if (discount) {
      setEditingDiscount(discount);
      const existingProductIds = discount.products && discount.products.length > 0
        ? discount.products.map((dp: any) => dp.productId || dp.product?.id).filter(Boolean)
        : discount.productId ? [discount.productId] : [];

      setFormData({
        label: discount.label,
        couponCode: discount.couponCode || '',
        percentage: Number(discount.percentage),
        scope: discount.scope,
        audience: discount.audience,
        productIds: existingProductIds,
        categoryId: discount.categoryId || '',
        startsAt: toDateInputValue(discount.startsAt),
        endsAt: toDateInputValue(discount.endsAt),
        active: discount.active,
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        label: '',
        couponCode: '',
        percentage: 0,
        scope: 'GLOBAL',
        audience: 'ALL',
        productIds: [],
        categoryId: '',
        startsAt: '',
        endsAt: '',
        active: true,
      });
    }
    setProductSearch('');
    setIsModalOpen(true);
  };

  const toggleProductSelect = (productId: string) => {
    setFormData((prev) => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      };
    });
  };

  const selectAllFilteredProducts = (filtered: any[]) => {
    const ids = filtered.map((p) => p.id);
    setFormData((prev) => ({
      ...prev,
      productIds: Array.from(new Set([...prev.productIds, ...ids])),
    }));
  };

  const deselectAllProducts = () => {
    setFormData((prev) => ({ ...prev, productIds: [] }));
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h2 className="font-serif font-bold text-lg text-gray-900 flex items-center gap-2">
            <Percent className="text-brand-pink shrink-0" size={20} /> Descuentos y Cupones
          </h2>
          <p className="text-xs text-gray-500">Configura promociones por porcentaje, categoría o cupones.</p>
        </div>
        <Button onClick={() => openModal()} className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2 h-10 w-full sm:w-auto">
          <Plus size={16} /> Nuevo Descuento
        </Button>
      </div>

      {/* Mobile Card List (visible < md) */}
      <div className="block md:hidden p-3 space-y-3">
        {discounts.map((d) => {
          const productNames = d.products && d.products.length > 0
            ? d.products.map((dp: any) => dp.product?.name).filter(Boolean)
            : d.product ? [d.product.name] : [];

          return (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-xs">
              {/* Header: Label + % + Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{d.label}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-base font-bold text-brand-pink-dark">
                      {Number(d.percentage)}% OFF
                    </span>
                    {d.couponCode ? (
                      <span className="font-mono text-[11px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                        Cupón: {d.couponCode}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Automático</span>
                    )}
                  </div>
                </div>

                {d.active ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                    Inactivo
                  </span>
                )}
              </div>

              {/* Scope & Audience details */}
              <div className="space-y-1.5 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <Tag size={13} className="text-gray-400 shrink-0" />
                  <span>
                    Alcance: <strong>
                      {d.scope === 'GLOBAL' && 'Toda la tienda'}
                      {d.scope === 'CATEGORY' && `Categoría: ${d.category?.name || 'Varios'}`}
                      {d.scope === 'PRODUCT' && (productNames.length === 1 ? `1 producto: ${productNames[0]}` : `${productNames.length} productos seleccionados`)}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-gray-400 shrink-0" />
                  <span>
                    Audiencia:{' '}
                    {d.audience === 'ALL' && <span className="font-semibold text-gray-800">Todos los clientes</span>}
                    {d.audience === 'WHOLESALE' && <span className="font-semibold text-brand-pink-dark">Solo Mayoristas</span>}
                    {d.audience === 'DISTRIBUTOR' && <span className="font-semibold text-brand-distributor-dark">Solo pedidos con precio distribuidor</span>}
                  </span>
                </div>

                {(d.startsAt || d.endsAt) && (
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <Calendar size={13} className="text-gray-400 shrink-0" />
                    <span>
                      Vigencia: {d.startsAt ? new Date(d.startsAt).toLocaleDateString() : 'Inicio'} → {d.endsAt ? new Date(d.endsAt).toLocaleDateString() : 'Indefinido'}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openModal(d)}
                  className="flex-1 h-9 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 gap-1"
                >
                  <Edit size={14} /> Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(d.id)}
                  className="flex-1 h-9 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 gap-1"
                >
                  <Trash2 size={14} /> Eliminar
                </Button>
              </div>
            </div>
          );
        })}

        {discounts.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">
            No hay descuentos configurados.
          </div>
        )}
      </div>

      {/* Desktop Table View (visible >= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Etiqueta</th>
              <th className="px-4 py-3">Cupón</th>
              <th className="px-4 py-3">Porcentaje</th>
              <th className="px-4 py-3">Alcance</th>
              <th className="px-4 py-3">Audiencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {discounts.map((d) => {
              const productNames = d.products && d.products.length > 0
                ? d.products.map((dp: any) => dp.product?.name).filter(Boolean)
                : d.product ? [d.product.name] : [];

              return (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.label}</td>
                  <td className="px-4 py-3">
                    {d.couponCode ? (
                      <span className="font-mono text-xs font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                        {d.couponCode}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Automático</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-pink font-bold">{Number(d.percentage)}%</td>
                  <td className="px-4 py-3 text-gray-600">
                    {d.scope === 'GLOBAL' && 'Global'}
                    {d.scope === 'CATEGORY' && `Cat: ${d.category?.name || 'Varios'}`}
                    {d.scope === 'PRODUCT' && (
                      <span title={productNames.join(', ')}>
                        {productNames.length === 1
                          ? `Prod: ${productNames[0]}`
                          : productNames.length > 1
                          ? `${productNames.length} productos seleccionados`
                          : 'Sin productos'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {d.audience === 'ALL' && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Todos</span>}
                    {d.audience === 'WHOLESALE' && <span className="text-xs bg-brand-pink/10 text-brand-pink-dark px-2 py-0.5 rounded-full">Mayoristas</span>}
                    {d.audience === 'DISTRIBUTOR' && <span className="text-xs bg-brand-distributor/20 text-brand-distributor-dark font-medium px-2 py-0.5 rounded-full">Precio distribuidor</span>}
                  </td>
                  <td className="px-4 py-3">
                    {d.active ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Activo</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openModal(d)} className="text-blue-600 hover:bg-blue-50">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} className="text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {discounts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No hay descuentos configurados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Responsive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0">
              <h3 className="text-base sm:text-lg font-bold font-serif text-gray-900">
                {editingDiscount ? 'Editar Descuento' : 'Nuevo Descuento'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pt-3 pr-1">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Etiqueta (Ej. Descuento Verano)</label>
                <Input required value={formData.label} onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))} />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">
                  Código de cupón <span className="text-xs text-gray-500 font-normal">(Opcional — ej. VERANO20)</span>
                </label>
                <Input
                  placeholder="Ej. VERANO20 (vacío = aplica automático)"
                  value={formData.couponCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Si defines un código, el descuento SOLO aplicará cuando el cliente ingrese el cupón en el carrito.
                </p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Porcentaje (%)</label>
                <Input type="number" min="1" max="100" required value={formData.percentage} onChange={(e) => setFormData(prev => ({ ...prev, percentage: Number(e.target.value) }))} />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1">Alcance</label>
                <select className="w-full border rounded-xl h-10 px-3 text-sm bg-white" value={formData.scope} onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value as DiscountScope }))}>
                  <option value="GLOBAL">Global (Toda la tienda)</option>
                  <option value="CATEGORY">Categoría específica</option>
                  <option value="PRODUCT">Productos específicos (Multi-selección)</option>
                </select>
              </div>

              {formData.scope === 'CATEGORY' && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Categoría</label>
                  <select required className="w-full border rounded-xl h-10 px-3 text-sm bg-white" value={formData.categoryId} onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}>
                    <option value="">Seleccione...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {formData.scope === 'PRODUCT' && (
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-medium">
                    Seleccionar Productos ({formData.productIds.length} seleccionados)
                  </label>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nombre..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>

                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => selectAllFilteredProducts(filteredProducts)}
                      className="text-brand-pink-dark hover:underline font-medium"
                    >
                      Seleccionar visibles ({filteredProducts.length})
                    </button>
                    <span>|</span>
                    <button
                      type="button"
                      onClick={deselectAllProducts}
                      className="text-gray-500 hover:underline"
                    >
                      Desmarcar todos
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto border rounded-xl p-2 space-y-1 bg-gray-50">
                    {filteredProducts.map((p) => {
                      const isSelected = formData.productIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProductSelect(p.id)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs sm:text-sm transition-colors ${
                            isSelected ? 'bg-brand-pink-light/20 text-brand-pink-dark font-medium' : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-brand-pink shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-gray-400 shrink-0" />
                          )}
                          <span className="truncate">{p.name}</span>
                        </div>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-3">No hay productos que coincidan</p>
                    )}
                  </div>
                </div>
              )}

              <fieldset className="border p-3 rounded-xl">
                <legend className="text-xs sm:text-sm font-medium px-1 text-gray-700">¿A quién aplica este descuento?</legend>
                <div className="space-y-2 mt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="audience" value="ALL" checked={formData.audience === 'ALL'} onChange={() => setFormData(prev => ({ ...prev, audience: 'ALL' }))} /> 
                    <span className="text-xs sm:text-sm">Todos los clientes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="audience" value="WHOLESALE" checked={formData.audience === 'WHOLESALE'} onChange={() => setFormData(prev => ({ ...prev, audience: 'WHOLESALE' }))} />
                    <span className="text-xs sm:text-sm">Solo mayoristas aprobados</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="audience" value="DISTRIBUTOR" checked={formData.audience === 'DISTRIBUTOR'} onChange={() => setFormData(prev => ({ ...prev, audience: 'DISTRIBUTOR' }))} />
                    <span className="text-xs sm:text-sm">
                      Solo pedidos que alcanzaron el precio de distribuidor
                    </span>
                  </label>
                </div>
              </fieldset>

              <fieldset className="border p-3 rounded-xl">
                <legend className="text-xs sm:text-sm font-medium px-1 text-gray-700">Vigencia (opcional)</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Fecha inicio</label>
                    <Input type="date" value={formData.startsAt} onChange={(e) => setFormData(prev => ({ ...prev, startsAt: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 text-gray-600">Fecha fin</label>
                    <Input type="date" value={formData.endsAt} min={formData.startsAt || undefined} onChange={(e) => setFormData(prev => ({ ...prev, endsAt: e.target.value }))} />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">Sin fechas = siempre activo.</p>
              </fieldset>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input type="checkbox" checked={formData.active} onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))} />
                <span className="text-sm font-medium">Activo</span>
              </label>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 shrink-0">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button type="submit" className="bg-brand-pink text-white hover:bg-brand-pink-dark">Guardar</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
