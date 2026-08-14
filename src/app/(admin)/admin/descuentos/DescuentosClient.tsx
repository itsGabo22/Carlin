'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, Search, CheckSquare, Square } from 'lucide-react';
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-semibold text-gray-700">Descuentos Configurados</h2>
        <Button onClick={() => openModal()} className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2">
          <Plus size={16} /> Nuevo Descuento
        </Button>
      </div>

      <div className="overflow-x-auto">
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
                    {d.audience === 'DISTRIBUTOR' && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Distribuidores</span>}
                  </td>
                  <td className="px-4 py-3">
                    {d.active ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Activo</span>
                    ) : (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openModal(d)} className="text-blue-600 hover:bg-blue-50">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} className="text-red-600 hover:bg-red-50">
                      <Trash2 size={16} />
                    </Button>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingDiscount ? 'Editar Descuento' : 'Nuevo Descuento'}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Etiqueta (Ej. Descuento Verano)</label>
                <Input required value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Código de cupón <span className="text-xs text-gray-500 font-normal">(Opcional — ej. VERANO20)</span>
                </label>
                <Input
                  placeholder="Ej. VERANO20 (vacío = aplica automático)"
                  value={formData.couponCode}
                  onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Si defines un código, el descuento SOLO aplicará cuando el cliente ingrese el cupón en el carrito.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Porcentaje (%)</label>
                <Input type="number" min="1" max="100" required value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value) })} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Alcance</label>
                <select className="w-full border rounded-md h-10 px-3" value={formData.scope} onChange={(e) => setFormData({ ...formData, scope: e.target.value as DiscountScope })}>
                  <option value="GLOBAL">Global (Toda la tienda)</option>
                  <option value="CATEGORY">Categoría específica</option>
                  <option value="PRODUCT">Productos específicos (Multi-selección)</option>
                </select>
              </div>

              {formData.scope === 'CATEGORY' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select required className="w-full border rounded-md h-10 px-3" value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}>
                    <option value="">Seleccione...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {formData.scope === 'PRODUCT' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
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

                  <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1 bg-gray-50">
                    {filteredProducts.map((p) => {
                      const isSelected = formData.productIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProductSelect(p.id)}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors ${
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

              <fieldset className="border p-3 rounded-md mt-4">
                <legend className="text-sm font-medium px-1 text-gray-700">¿A quién aplica este descuento?</legend>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="audience" value="ALL" checked={formData.audience === 'ALL'} onChange={() => setFormData({ ...formData, audience: 'ALL' })} /> 
                    <span className="text-sm">Todos los clientes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="audience" value="WHOLESALE" checked={formData.audience === 'WHOLESALE'} onChange={() => setFormData({ ...formData, audience: 'WHOLESALE' })} />
                    <span className="text-sm">Solo mayoristas aprobados</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="audience" value="DISTRIBUTOR" checked={formData.audience === 'DISTRIBUTOR'} onChange={() => setFormData({ ...formData, audience: 'DISTRIBUTOR' })} />
                    <span className="text-sm">Solo distribuidores aprobados</span>
                  </label>
                </div>
              </fieldset>

              <fieldset className="border p-3 rounded-md mt-4">
                <legend className="text-sm font-medium px-1 text-gray-700">Vigencia (opcional)</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha inicio</label>
                    <Input type="date" value={formData.startsAt} onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fecha fin</label>
                    <Input type="date" value={formData.endsAt} min={formData.startsAt || undefined} onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Sin fechas = siempre activo. Borra el valor para quitar el límite.</p>
              </fieldset>

              <label className="flex items-center gap-2 mt-4 cursor-pointer">
                <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} />
                <span className="text-sm font-medium">Activo</span>
              </label>

              <div className="flex justify-end gap-2 pt-4">
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
