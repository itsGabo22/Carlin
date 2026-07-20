'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
  
  const [formData, setFormData] = useState({
    label: '',
    percentage: 0,
    scope: 'GLOBAL' as DiscountScope,
    audience: 'ALL' as DiscountAudience,
    productId: '',
    categoryId: '',
    active: true,
  });

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
        productId: formData.scope === 'PRODUCT' ? formData.productId : null,
        categoryId: formData.scope === 'CATEGORY' ? formData.categoryId : null,
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
      setFormData({
        label: discount.label,
        percentage: Number(discount.percentage),
        scope: discount.scope,
        audience: discount.audience,
        productId: discount.productId || '',
        categoryId: discount.categoryId || '',
        active: discount.active,
      });
    } else {
      setEditingDiscount(null);
      setFormData({
        label: '',
        percentage: 0,
        scope: 'GLOBAL',
        audience: 'ALL',
        productId: '',
        categoryId: '',
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between">
        <h2 className="font-semibold text-gray-700">Descuentos Activos</h2>
        <Button onClick={() => openModal()} className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2">
          <Plus size={16} /> Nuevo Descuento
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Etiqueta</th>
              <th className="px-4 py-3">Porcentaje</th>
              <th className="px-4 py-3">Alcance</th>
              <th className="px-4 py-3">Audiencia</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {discounts.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{d.label}</td>
                <td className="px-4 py-3 text-brand-pink font-bold">{Number(d.percentage)}%</td>
                <td className="px-4 py-3 text-gray-600">
                  {d.scope === 'GLOBAL' && 'Global'}
                  {d.scope === 'CATEGORY' && `Cat: ${d.category?.name}`}
                  {d.scope === 'PRODUCT' && `Prod: ${d.product?.name}`}
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
            ))}
            {discounts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No hay descuentos configurados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{editingDiscount ? 'Editar Descuento' : 'Nuevo Descuento'}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Etiqueta (Ej. VERANO20)</label>
                <Input required value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Porcentaje (%)</label>
                <Input type="number" min="0" max="100" required value={formData.percentage} onChange={e => setFormData({...formData, percentage: Number(e.target.value)})} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Alcance</label>
                <select className="w-full border rounded-md h-10 px-3" value={formData.scope} onChange={e => setFormData({...formData, scope: e.target.value as DiscountScope})}>
                  <option value="GLOBAL">Global (Toda la tienda)</option>
                  <option value="CATEGORY">Categoría específica</option>
                  <option value="PRODUCT">Producto específico</option>
                </select>
              </div>

              {formData.scope === 'CATEGORY' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select required className="w-full border rounded-md h-10 px-3" value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                    <option value="">Seleccione...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {formData.scope === 'PRODUCT' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Producto</label>
                  <select required className="w-full border rounded-md h-10 px-3" value={formData.productId} onChange={e => setFormData({...formData, productId: e.target.value})}>
                    <option value="">Seleccione...</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}

              <fieldset className="border p-3 rounded-md mt-4">
                <legend className="text-sm font-medium px-1 text-gray-700">¿A quién aplica este descuento?</legend>
                <div className="space-y-2 mt-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="audience" value="ALL" checked={formData.audience === 'ALL'} onChange={() => setFormData({...formData, audience: 'ALL'})} /> 
                    <span className="text-sm">Todos los clientes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="audience" value="WHOLESALE" checked={formData.audience === 'WHOLESALE'} onChange={() => setFormData({...formData, audience: 'WHOLESALE'})} />
                    <span className="text-sm">Solo mayoristas aprobados</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="audience" value="DISTRIBUTOR" checked={formData.audience === 'DISTRIBUTOR'} onChange={() => setFormData({...formData, audience: 'DISTRIBUTOR'})} />
                    <span className="text-sm">Solo distribuidores aprobados</span>
                  </label>
                </div>
              </fieldset>

              <label className="flex items-center gap-2 mt-4">
                <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
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
