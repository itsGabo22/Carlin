'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
// Using standard state instead of react-hook-form to simplify implementation since we don't have the schema yet
import { Save, ArrowLeft, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import slugify from 'slugify';
import Link from 'next/link';

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === 'nuevo';

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    retailPrice: 0,
    wholesalePrice: 0,
    distributorPrice: 0,
    comparePrice: 0,
    sku: '',
    stock: 0,
    unit: 'unidad',
    tones: [] as string[],
    imageUrls: [] as string[],
    featured: false,
    active: true,
    categoryId: '',
    brandId: '',
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [bandejaImages, setBandejaImages] = useState<any[]>([]);
  const [newTone, setNewTone] = useState('');

  // We fetch standard relationships. We will use a mock fetch if endpoints aren't ready yet,
  // but assuming they will be, let's just make the calls or leave it empty for now
  useEffect(() => {
    // Fetch categories & brands
    Promise.all([
      fetch('/api/admin/categorias').then(r => r.json().catch(() => ({}))),
      fetch('/api/admin/marcas').then(r => r.json().catch(() => ({}))),
      fetch('/api/admin/imagenes?assigned=false').then(r => r.json().catch(() => ({})))
    ]).then(([cats, brnds, imgs]) => {
      if (cats.categories) setCategories(cats.categories);
      if (brnds.brands) setBrands(brnds.brands);
      if (imgs.images) setBandejaImages(imgs.images);
    });

    if (!isNew) {
      // fetch product
      fetch(`/api/admin/productos/${id}`).then(r => r.json()).then(data => {
        if (data) {
          setFormData(data);
        }
      });
    }
  }, [id, isNew]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData({
      ...formData,
      name,
      slug: slugify(name, { lower: true, strict: true })
    });
  };

  const handleAddTone = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTone.trim()) {
      e.preventDefault();
      setFormData({ ...formData, tones: [...formData.tones, newTone.trim()] });
      setNewTone('');
    }
  };

  const removeTone = (index: number) => {
    const newTones = [...formData.tones];
    newTones.splice(index, 1);
    setFormData({ ...formData, tones: newTones });
  };

  const handleSelectImage = (url: string, imageId: string) => {
    if (formData.imageUrls.length >= 3) {
      alert('Máximo 3 imágenes por producto');
      return;
    }
    setFormData({ ...formData, imageUrls: [...formData.imageUrls, url] });
    
    // Optimistically mark as assigned in UI, actual DB update happens on Save
    setBandejaImages(bandejaImages.filter(img => img.id !== imageId));
  };

  const removeImage = (index: number) => {
    const newImages = [...formData.imageUrls];
    newImages.splice(index, 1);
    setFormData({ ...formData, imageUrls: newImages });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isNew ? '/api/admin/productos' : `/api/admin/productos/${id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/admin/productos');
        router.refresh();
      } else {
        alert('Error al guardar el producto');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/productos">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 hover:text-gray-900">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold font-nunito text-gray-900">
            {isNew ? 'Nuevo Producto' : 'Editar Producto'}
          </h1>
        </div>
        <Button onClick={handleSubmit} disabled={loading} className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2">
          <Save size={16} />
          {loading ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Información Básica</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input required value={formData.name} onChange={handleNameChange} placeholder="Ej: Base Líquida Matte" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input required value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} placeholder="base-liquida-matte" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-pink"
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descripción detallada del producto..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU</label>
                  <Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} placeholder="Ej: MAQ-001" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unidad de venta</label>
                  <Input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} placeholder="Ej: unidad, caja x12" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Precios e Inventario</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio Público</label>
                  <Input type="number" required value={formData.retailPrice} onChange={(e) => setFormData({...formData, retailPrice: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio Mayorista</label>
                  <Input type="number" required value={formData.wholesalePrice} onChange={(e) => setFormData({...formData, wholesalePrice: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio Distribuidor</label>
                  <Input type="number" required value={formData.distributorPrice} onChange={(e) => setFormData({...formData, distributorPrice: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Precio Comparativo (Opcional)</label>
                  <Input type="number" value={formData.comparePrice} onChange={(e) => setFormData({...formData, comparePrice: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock</label>
                  <Input type="number" required value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Tonos / Variantes</h2>
              <div className="space-y-2">
                <Input 
                  value={newTone} 
                  onChange={(e) => setNewTone(e.target.value)} 
                  onKeyDown={handleAddTone}
                  placeholder="Escribe un tono y presiona Enter" 
                />
                <div className="flex flex-wrap gap-2 pt-2">
                  {formData.tones.map((tone, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 rounded-md text-sm flex items-center gap-2 border">
                      {tone}
                      <X size={14} className="cursor-pointer hover:text-red-500" onClick={() => removeTone(idx)} />
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Organización</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Marca (Opcional)</label>
                <select 
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white"
                  value={formData.brandId}
                  onChange={(e) => setFormData({...formData, brandId: e.target.value})}
                >
                  <option value="">Sin marca</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 space-y-4 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({...formData, active: e.target.checked})} className="rounded text-brand-pink focus:ring-brand-pink" />
                  <span className="text-sm font-medium">Producto Activo</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({...formData, featured: e.target.checked})} className="rounded text-brand-pink focus:ring-brand-pink" />
                  <span className="text-sm font-medium">Destacado (Home)</span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 flex justify-between items-center">
                Imágenes
                <span className="text-xs text-gray-500 font-normal">{formData.imageUrls.length}/3</span>
              </h2>

              {/* Current Images */}
              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {formData.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square border rounded-md overflow-hidden group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Image Bandeja */}
              {formData.imageUrls.length < 3 && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-medium mb-3">Bandeja de imágenes (Sin asignar)</h3>
                  <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {bandejaImages.length === 0 ? (
                      <p className="col-span-3 text-xs text-gray-500 text-center py-4">No hay imágenes en la bandeja.</p>
                    ) : (
                      bandejaImages.map((img) => (
                        <div 
                          key={img.id} 
                          className="aspect-square border rounded-md overflow-hidden cursor-pointer hover:ring-2 ring-brand-pink transition-all"
                          onClick={() => handleSelectImage(img.url, img.id)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.filename} className="w-full h-full object-cover" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
