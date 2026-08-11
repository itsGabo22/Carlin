'use client';

import { useRef, useState } from 'react';
import {
  FolderTree, Plus, Edit, Trash2, ChevronRight, ChevronUp, ChevronDown,
  Eye, EyeOff, ImageIcon, Loader2, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  groupByBrand: boolean;
  imageUrl: string | null;
  active: boolean;
  order: number;
  _count: { products: number; children: number };
}

/** Lee JSON sin reventar si el body viene vacío (errores sin cuerpo). */
async function readJson(res: Response): Promise<any | null> {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

const porOrden = (a: CategoryRow, b: CategoryRow) =>
  a.order - b.order || a.name.localeCompare(b.name, 'es');

export function CategoriasClient({ categories }: { categories: CategoryRow[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    parentId: '',
    groupByBrand: false,
    imageUrl: '',
    active: true,
  });

  const rootCategories = categories.filter(c => !c.parentId).sort(porOrden);
  const hijasDe = (id: string) => categories.filter(c => c.parentId === id).sort(porOrden);

  const openNewModal = () => {
    setEditingId(null);
    setError(null);
    setForm({ name: '', slug: '', parentId: '', groupByBrand: false, imageUrl: '', active: true });
    setModalOpen(true);
  };

  const openEditModal = (category: CategoryRow) => {
    setEditingId(category.id);
    setError(null);
    setForm({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId || '',
      groupByBrand: category.groupByBrand,
      imageUrl: category.imageUrl || '',
      active: category.active,
    });
    setModalOpen(true);
  };

  /** Sube la imagen al bucket category-images (pasa por processAndUploadImage → Blob-wrap). */
  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'category-images');
      const res = await fetch('/api/admin/imagenes/upload', { method: 'POST', body: fd });
      const data = await readJson(res);
      if (!res.ok) {
        setError(data?.error ?? `No se pudo subir la imagen (error ${res.status}).`);
        return;
      }
      setForm(f => ({ ...f, imageUrl: data.url }));
    } catch {
      setError('Error de red al subir la imagen.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const url = editingId ? `/api/admin/categorias/${editingId}` : '/api/admin/categorias';
      const res = await fetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || undefined,
          parentId: form.parentId || null,
          groupByBrand: form.groupByBrand,
          imageUrl: form.imageUrl || null,
          active: form.active,
        }),
      });
      const data = await readJson(res);
      if (res.ok) {
        window.location.reload();
      } else {
        setError(data?.error ?? `No se pudo guardar (error ${res.status}).`);
        setSaving(false);
      }
    } catch {
      setError('Error de red al guardar.');
      setSaving(false);
    }
  };

  const handleDelete = async (category: CategoryRow) => {
    if (!confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    setBusyId(category.id);
    try {
      const res = await fetch(`/api/admin/categorias/${category.id}`, { method: 'DELETE' });
      const data = await readJson(res);
      if (res.ok) window.location.reload();
      else { alert(data?.error ?? 'Error eliminando la categoría'); setBusyId(null); }
    } catch {
      alert('Error de conexión');
      setBusyId(null);
    }
  };

  /** Toggle activo/inactivo sin abrir el modal. */
  const toggleActive = async (category: CategoryRow) => {
    setBusyId(category.id);
    try {
      const res = await fetch(`/api/admin/categorias/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !category.active }),
      });
      if (res.ok) window.location.reload();
      else {
        const data = await readJson(res);
        alert(data?.error ?? 'No se pudo cambiar el estado.');
        setBusyId(null);
      }
    } catch {
      alert('Error de conexión');
      setBusyId(null);
    }
  };

  /** Mueve una categoría dentro de su nivel y persiste el orden de todo el nivel. */
  const mover = async (category: CategoryRow, dir: -1 | 1) => {
    const hermanos = category.parentId ? hijasDe(category.parentId) : rootCategories;
    const i = hermanos.findIndex(c => c.id === category.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= hermanos.length) return;

    const reordenado = [...hermanos];
    [reordenado[i], reordenado[j]] = [reordenado[j], reordenado[i]];

    setBusyId(category.id);
    try {
      const res = await fetch('/api/admin/categorias/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: reordenado.map((c, idx) => ({ id: c.id, order: idx })) }),
      });
      if (res.ok) window.location.reload();
      else {
        const data = await readJson(res);
        alert(data?.error ?? 'No se pudo reordenar.');
        setBusyId(null);
      }
    } catch {
      alert('Error de conexión');
      setBusyId(null);
    }
  };

  const Miniatura = ({ url, name }: { url: string | null; name: string }) => (
    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <ImageIcon size={14} className="text-gray-300" />
      )}
    </div>
  );

  const Acciones = ({ category, deleteDisabled }: { category: CategoryRow; deleteDisabled: boolean }) => {
    const hermanos = category.parentId ? hijasDe(category.parentId) : rootCategories;
    const i = hermanos.findIndex(c => c.id === category.id);
    const ocupado = busyId === category.id;

    return (
      <div className="col-span-3 flex items-center justify-end gap-0.5">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700 disabled:opacity-25"
          disabled={ocupado || i <= 0} onClick={() => mover(category, -1)} title="Subir">
          <ChevronUp size={15} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700 disabled:opacity-25"
          disabled={ocupado || i < 0 || i >= hermanos.length - 1} onClick={() => mover(category, 1)} title="Bajar">
          <ChevronDown size={15} />
        </Button>
        <Button variant="ghost" size="icon"
          className={`h-8 w-8 ${category.active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
          disabled={ocupado} onClick={() => toggleActive(category)}
          title={category.active ? 'Visible en la tienda — clic para ocultar' : 'Oculta — clic para mostrar'}>
          {category.active ? <Eye size={15} /> : <EyeOff size={15} />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          disabled={ocupado} onClick={() => openEditModal(category)} title="Editar categoría">
          <Edit size={15} />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          disabled={ocupado || deleteDisabled} onClick={() => handleDelete(category)}
          title={deleteDisabled ? 'No se puede eliminar: tiene productos o subcategorías' : 'Eliminar categoría'}>
          <Trash2 size={15} />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-serif text-gray-900 flex items-center gap-2">
            <FolderTree className="text-brand-pink" /> Categorías
          </h1>
          <p className="text-gray-500">Organiza el catálogo en categorías y subcategorías.</p>
        </div>
        <Button onClick={openNewModal} className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2">
          <Plus size={16} /> Nueva categoría
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <div className="text-sm bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 flex items-start gap-2 border border-blue-100">
          <div className="shrink-0 mt-0.5">ℹ️</div>
          <div className="space-y-1">
            <p>
              Las subcategorías son categorías con una <strong>categoría padre</strong> asignada.
              Su <strong>imagen</strong> es la que se muestra en los círculos de la página de categoría,
              así que conviene subir una foto cuadrada.
            </p>
            <p>
              El <strong>ojo</strong> oculta o muestra la categoría en la tienda sin borrarla, y las
              flechas cambian el orden en que aparece.
            </p>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 grid grid-cols-12 px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-600">
            <div className="col-span-5">Estructura</div>
            <div className="col-span-2">Slug</div>
            <div className="col-span-2 text-center">N° Productos</div>
            <div className="col-span-3 text-right">Acciones</div>
          </div>
          <div className="divide-y divide-gray-100">
            {rootCategories.map((category) => {
              const children = hijasDe(category.id);
              return (
                <div key={category.id} className="flex flex-col">
                  <div className={`grid grid-cols-12 items-center px-4 py-3 hover:bg-gray-50 transition-colors ${category.active ? '' : 'opacity-55'}`}>
                    <div className="col-span-5 flex items-center gap-2 font-medium text-gray-900">
                      {children.length > 0 ? <ChevronRight size={16} className="text-gray-400" /> : <div className="w-4" />}
                      <Miniatura url={category.imageUrl} name={category.name} />
                      {category.name}
                      {!category.active && (
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">OCULTA</span>
                      )}
                      {category.groupByBrand && (
                        <span className="text-[10px] bg-brand-pink/10 text-brand-pink-dark px-2 py-0.5 rounded-full font-bold">AGRUPA MARCAS</span>
                      )}
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">{category.slug}</div>
                    <div className="col-span-2 text-center text-sm">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {category._count.products} prod
                      </span>
                    </div>
                    <Acciones category={category} deleteDisabled={category._count.products > 0 || category._count.children > 0} />
                  </div>

                  {children.map(child => (
                    <div key={child.id} className={`grid grid-cols-12 items-center px-4 py-2 hover:bg-gray-50 transition-colors border-t border-gray-50 bg-gray-50/30 ${child.active ? '' : 'opacity-55'}`}>
                      <div className="col-span-5 flex items-center gap-2 text-gray-700 text-sm pl-8">
                        <span className="text-gray-300">└</span>
                        <Miniatura url={child.imageUrl} name={child.name} />
                        {child.name}
                        {!child.active && (
                          <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">OCULTA</span>
                        )}
                        {child.groupByBrand && (
                          <span className="text-[10px] bg-brand-pink/10 text-brand-pink-dark px-2 py-0.5 rounded-full font-bold">AGRUPA MARCAS</span>
                        )}
                      </div>
                      <div className="col-span-2 text-sm text-gray-500">{child.slug}</div>
                      <div className="col-span-2 text-center text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {child._count.products} prod
                        </span>
                      </div>
                      <Acciones category={child} deleteDisabled={child._count.products > 0} />
                    </div>
                  ))}
                </div>
              );
            })}

            {rootCategories.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No hay categorías registradas. Crea una para comenzar.
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar Categoría' : 'Nueva Categoría'}>
        <form onSubmit={handleSave} className="space-y-4 mt-2">
          {error && (
            <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre</label>
            <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Maquillaje" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Slug (opcional)</label>
            <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="Se genera automático desde el nombre" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría padre</label>
            <select
              className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white"
              value={form.parentId}
              onChange={e => setForm({ ...form, parentId: e.target.value })}
            >
              <option value="">Ninguna (categoría raíz)</option>
              {categories
                .filter(c => c.id !== editingId)
                .sort(porOrden)
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.parentId ? `— ${c.name}` : c.name}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500">
              Si eliges un padre, esta categoría se convierte en subcategoría y aparece en los círculos de esa categoría.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Imagen</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                {form.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-brand-pink/10 file:text-brand-pink-dark hover:file:bg-brand-pink/20"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Subiendo y optimizando…
                  </p>
                )}
                {form.imageUrl && !uploading && (
                  <button type="button" onClick={() => setForm({ ...form, imageUrl: '' })}
                    className="text-xs text-red-600 hover:underline flex items-center gap-1">
                    <X size={12} /> Quitar imagen
                  </button>
                )}
                <p className="text-xs text-gray-500">Se recorta en círculo: usa una foto cuadrada.</p>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })}
              className="rounded text-brand-pink focus:ring-brand-pink" />
            <span className="text-sm font-medium">Visible en la tienda</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.groupByBrand}
              onChange={e => setForm({ ...form, groupByBrand: e.target.checked })}
              className="rounded text-brand-pink focus:ring-brand-pink" />
            <span className="text-sm font-medium">Agrupar por marca en el catálogo</span>
          </label>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving || uploading} className="bg-brand-pink hover:bg-brand-pink-dark text-white">
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
