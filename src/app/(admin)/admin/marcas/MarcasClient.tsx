'use client';

import { useState } from 'react';
import { Tags, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  _count: { products: number };
}

export function MarcasClient({ brands }: { brands: BrandRow[] }) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', logoUrl: '' });

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const openNewModal = () => {
    setEditingId(null);
    setForm({ name: '', slug: '', logoUrl: '' });
    setModalOpen(true);
  };

  const openEditModal = (brand: BrandRow) => {
    setEditingId(brand.id);
    setForm({ name: brand.name, slug: brand.slug, logoUrl: brand.logoUrl || '' });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/marcas/${editingId}` : '/api/admin/marcas';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || undefined,
          logoUrl: form.logoUrl || null,
        }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Error guardando la marca');
        setSaving(false);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
      setSaving(false);
    }
  };

  const handleDelete = async (brand: BrandRow) => {
    if (!confirm(`¿Eliminar la marca "${brand.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/marcas/${brand.id}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || 'Error eliminando la marca');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-serif text-gray-900 flex items-center gap-2">
            <Tags className="text-brand-pink" /> Marcas
          </h1>
          <p className="text-gray-500">Administra las marcas de los productos.</p>
        </div>
        <Button onClick={openNewModal} className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2">
          <Plus size={16} /> Nueva marca
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              className="pl-9"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Logo</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">N° Productos</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBrands.map((brand) => (
                <tr key={brand.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-10 h-10 rounded-md bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-gray-400">
                      {brand.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-cover" />
                      ) : (
                        <Tags size={16} />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{brand.name}</td>
                  <td className="px-4 py-3 text-gray-500">{brand.slug}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {brand._count.products} productos
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => openEditModal(brand)}
                        title="Editar marca"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={brand._count.products > 0}
                        onClick={() => handleDelete(brand)}
                        title={brand._count.products > 0 ? 'No se puede eliminar: tiene productos asociados' : 'Eliminar marca'}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredBrands.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {brands.length === 0
                      ? 'No hay marcas registradas. Crea una para comenzar.'
                      : 'Ninguna marca coincide con la búsqueda.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Marca' : 'Nueva Marca'}>
        <form onSubmit={handleSave} className="space-y-4 mt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input required value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Ej: Vogue" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Slug (opcional)</label>
            <Input value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))} placeholder="Se genera automático desde el nombre" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">URL del logo (opcional)</label>
            <Input value={form.logoUrl} onChange={e => setForm(prev => ({ ...prev, logoUrl: e.target.value }))} placeholder="https://..." />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="bg-brand-pink hover:bg-brand-pink-dark text-white">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
