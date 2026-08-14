'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Image as ImageIcon, X, Trash2, UploadCloud, Plus, Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import slugify from 'slugify';
import Link from 'next/link';
import { FieldHint } from '@/components/admin/FieldHint';
import { Tooltip } from '@/components/admin/Tooltip';

async function readJson(res: Response): Promise<any | null> {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const numOrZero = (value: string) => {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
};

const intOrZero = (value: string) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
};

interface FormVariant {
  id?: string;
  colorName: string;
  colorHex: string;
  imageUrl: string;
  stock: number;
  active: boolean;
  order: number;
}

export default function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === 'nuevo';

  const [loading, setLoading] = useState(false);
  const [uploadingDirectImage, setUploadingDirectImage] = useState(false);
  const [uploadingVariantImage, setUploadingVariantImage] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
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
    variants: [] as FormVariant[],
  });

  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [bandejaImages, setBandejaImages] = useState<any[]>([]);
  const [newTone, setNewTone] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const variantFileInputRef = useRef<HTMLInputElement>(null);

  // New variant draft form
  const [variantDraft, setVariantDraft] = useState<FormVariant>({
    colorName: '',
    colorHex: '#F0A0C6',
    imageUrl: '',
    stock: 10,
    active: true,
    order: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/categorias').then(r => r.json().catch(() => ({}))),
      fetch('/api/admin/marcas').then(r => r.json().catch(() => ({}))),
      fetch('/api/admin/imagenes?assigned=false').then(r => r.json().catch(() => ({})))
    ]).then(([cats, brnds, imgs]) => {
      if (cats.categories) setCategories(cats.categories);
      if (brnds.brands) setBrands(brnds.brands);
      if (imgs.images) setBandejaImages(imgs.images);
    }).catch(() => {
      setLoadError('No se pudieron cargar las categorías, marcas e imágenes. Revisa tu conexión y recarga la página.');
    });

    if (!isNew) {
      fetch(`/api/admin/productos/${id}`)
        .then(async (r) => {
          const data = await readJson(r);
          if (!r.ok) {
            setLoadError(data?.error ?? `No se pudo cargar el producto (error ${r.status}). No guardes: sobrescribirías los datos con el formulario vacío.`);
            return;
          }
          if (data) {
            setLoadError(null);
            setFormData(prev => ({
              ...prev,
              ...data,
              variants: data.variants ? data.variants.map((v: any) => ({
                id: v.id,
                colorName: v.colorName,
                colorHex: v.colorHex || '#F0A0C6',
                imageUrl: v.imageUrl,
                stock: Number(v.stock),
                active: v.active !== false,
                order: Number(v.order || 0),
              })) : [],
            }));
          }
        })
        .catch(() => {
          setLoadError('No se pudo cargar el producto. Revisa tu conexión y recarga la página.');
        });
    }
  }, [id, isNew]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: slugify(name, { lower: true, strict: true })
    }));
  };

  const handleAddTone = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTone.trim()) {
      e.preventDefault();
      setFormData(prev => ({ ...prev, tones: [...prev.tones, newTone.trim()] }));
      setNewTone('');
    }
  };

  const removeTone = (index: number) => {
    setFormData(prev => ({ ...prev, tones: prev.tones.filter((_, idx) => idx !== index) }));
  };

  const handleSelectImage = (url: string, imageId: string) => {
    if (formData.imageUrls.length >= 3) {
      alert('Máximo 3 imágenes por producto');
      return;
    }
    setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
    setBandejaImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (formData.imageUrls.length >= 3) {
      alert('Máximo 3 imágenes por producto');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingDirectImage(true);
    setSaveError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'product-images');

      const res = await fetch('/api/admin/imagenes/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await readJson(res);
      if (!res.ok) {
        setSaveError(data?.error ?? 'Error al subir la imagen');
        return;
      }

      const uploadedUrl = data.url || data.imageRecord?.url;
      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, uploadedUrl] }));
      }
    } catch {
      setSaveError('Error de red al subir la imagen.');
    } finally {
      setUploadingDirectImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVariantImage(true);
    setSaveError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('bucket', 'product-images');

      const res = await fetch('/api/admin/imagenes/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await readJson(res);
      if (!res.ok) {
        setSaveError(data?.error ?? 'Error al subir la imagen de la variante');
        return;
      }

      const uploadedUrl = data.url || data.imageRecord?.url;
      if (uploadedUrl) {
        setVariantDraft(prev => ({ ...prev, imageUrl: uploadedUrl }));
      }
    } catch {
      setSaveError('Error de red al subir la imagen de la variante.');
    } finally {
      setUploadingVariantImage(false);
      if (variantFileInputRef.current) variantFileInputRef.current.value = '';
    }
  };

  const addVariant = () => {
    if (!variantDraft.colorName.trim()) {
      alert('Ingresa el nombre del color para la variante');
      return;
    }
    if (!variantDraft.imageUrl) {
      alert('Sube una imagen específica para la variante');
      return;
    }

    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          ...variantDraft,
          colorName: variantDraft.colorName.trim(),
          order: prev.variants.length,
        }
      ]
    }));

    setVariantDraft({
      colorName: '',
      colorHex: '#F0A0C6',
      imageUrl: '',
      stock: 10,
      active: true,
      order: 0,
    });
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index)
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, imageUrls: prev.imageUrls.filter((_, idx) => idx !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || uploadingDirectImage || uploadingVariantImage) return;

    if (loadError && !isNew) {
      setSaveError('No se cargaron los datos del producto. Recarga la página antes de guardar para no sobrescribirlos.');
      return;
    }

    setSaveError(null);
    setLoading(true);

    try {
      const url = isNew ? '/api/admin/productos' : `/api/admin/productos/${id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await readJson(res);

      if (res.ok) {
        router.push('/admin/productos');
        router.refresh();
      } else {
        setSaveError(data?.error ?? `No se pudo guardar el producto (error ${res.status}). Intenta de nuevo.`);
      }
    } catch (error) {
      console.error(error);
      setSaveError('Error de red al guardar. Revisa tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const totalVariantStock = formData.variants.reduce((acc, v) => acc + (v.stock || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/productos">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-500 hover:text-gray-900">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold font-serif text-gray-900">
            {isNew ? 'Nuevo Producto' : 'Editar Producto'}
          </h1>
        </div>
        <Button onClick={handleSubmit} disabled={loading || uploadingDirectImage || uploadingVariantImage} className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2">
          <Save size={16} />
          {loading ? 'Guardando...' : (uploadingDirectImage || uploadingVariantImage) ? 'Subiendo imagen...' : 'Guardar'}
        </Button>
      </div>

      {loadError && (
        <div role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <strong className="font-semibold">No se pudo cargar la información. </strong>
          {loadError}
        </div>
      )}

      {saveError && (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <strong className="font-semibold">No se guardó el producto. </strong>
          {saveError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Información Básica</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input required value={formData.name} onChange={handleNameChange} placeholder="Ej: Base Líquida Matte" />
                <FieldHint text="Escribe el nombre tal como lo verán tus clientes. Ej: 'Base Líquida Matte OG Tono Natural'" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Slug</label>
                <Input required value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="base-liquida-matte" />
                <FieldHint text="Se genera automáticamente desde el nombre. Es la dirección del producto en la web. No uses espacios ni tildes." type="warning" />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <textarea 
                  className="w-full min-h-[100px] p-3 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-pink text-sm"
                  value={formData.description} 
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción detallada del producto..."
                />
                <FieldHint text="Describe el producto: tipo, uso, beneficios. Una buena descripción ayuda a que los clientes encuentren el producto en el buscador." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU</label>
                  <Input value={formData.sku} onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))} placeholder="Ej: MAQ-001" />
                  <FieldHint text="Código interno de referencia. Ej: OG-BASE-001. Opcional pero útil para controlar inventario." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unidad de venta</label>
                  <Input value={formData.unit} onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))} placeholder="Ej: unidad, caja x12" />
                  <FieldHint text='Cómo se vende la unidad. Ej: "unidad", "kit de 12", "caja x6", "display x24".' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Precios e Inventario</h2>
              
              <div className="bg-brand-pink-light/30 border border-brand-pink/20 rounded-xl p-3 mb-4">
                <p className="text-xs font-semibold text-brand-pink-dark mb-1">
                  💡 ¿Cómo funcionan los precios?
                </p>
                <ul className="text-xs text-neutral-600 space-y-0.5">
                  <li>• <strong>Precio público:</strong> lo ven todos los visitantes sin cuenta.</li>
                  <li>• <strong>Precio mayorista:</strong> lo ven los mayoristas aprobados (mínimo $200.000).</li>
                  <li>• <strong>Precio distribuidor:</strong> lo ven los distribuidores aprobados (mínimo $400.000).</li>
                  <li>• <strong>Precio comparativo:</strong> opcional. Si es mayor al público, se muestra tachado como oferta.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio Público</label>
                  <Input type="number" required value={formData.retailPrice} onChange={(e) => setFormData(prev => ({ ...prev, retailPrice: numOrZero(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio Mayorista</label>
                  <Input type="number" required value={formData.wholesalePrice} onChange={(e) => setFormData(prev => ({ ...prev, wholesalePrice: numOrZero(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio Distribuidor</label>
                  <Input type="number" required value={formData.distributorPrice} onChange={(e) => setFormData(prev => ({ ...prev, distributorPrice: numOrZero(e.target.value) }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Precio Comparativo (Opcional)</label>
                  <Input type="number" value={formData.comparePrice} onChange={(e) => setFormData(prev => ({ ...prev, comparePrice: numOrZero(e.target.value) }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Stock {formData.variants.length > 0 ? '(Calculado de variantes)' : 'General'}
                  </label>
                  {formData.variants.length > 0 ? (
                    <div className="h-10 px-3 py-2 bg-gray-100 border border-gray-200 rounded-md text-sm font-bold text-brand-pink-dark flex items-center justify-between">
                      <span>{totalVariantStock} unidades en total</span>
                      <span className="text-xs font-normal text-gray-500">({formData.variants.length} variantes)</span>
                    </div>
                  ) : (
                    <Input type="number" required value={formData.stock} onChange={(e) => setFormData(prev => ({ ...prev, stock: intOrZero(e.target.value) }))} />
                  )}
                  <FieldHint text={formData.variants.length > 0 ? "El stock se suma automáticamente de cada variante de color." : "Cuando confirmes un pedido desde 'Pedidos', el stock baja automáticamente."} type="tip" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variantes de Color con Imagen Propia */}
          <Card className="border border-brand-pink/20 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <Palette className="w-5 h-5 text-brand-pink" />
                  Variantes de Color (Tonalidades)
                </h2>
                <span className="text-xs bg-brand-pink-light/30 text-brand-pink-dark font-semibold px-2.5 py-1 rounded-full">
                  {formData.variants.length} variantes
                </span>
              </div>

              <p className="text-xs text-gray-500">
                Agrega variantes de color para productos como labiales, bases o esmaltes. Cada variante tiene su propio swatch de color, imagen dedicada e inventario independiente.
              </p>

              {/* Existing Variants List */}
              {formData.variants.length > 0 && (
                <div className="space-y-2">
                  {formData.variants.map((v, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-full border border-black/20 shadow-inner shrink-0"
                          style={{ backgroundColor: v.colorHex || '#F0A0C6' }}
                          title={v.colorHex}
                        />
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={v.imageUrl} alt={v.colorName} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{v.colorName}</p>
                          <p className="text-xs text-gray-500">Stock: <strong className="text-brand-pink-dark">{v.stock}</strong> u.</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeVariant(idx)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Quitar variante"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Variant Form */}
              <div className="p-4 bg-brand-pink-light/10 border border-brand-pink/20 rounded-xl space-y-3 mt-4">
                <h3 className="text-xs font-bold text-brand-pink-dark uppercase tracking-wider">
                  + Agregar Nueva Variante de Color
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del Color</label>
                    <Input
                      placeholder="Ej. Rosa Nude, Tono 01"
                      value={variantDraft.colorName}
                      onChange={(e) => setVariantDraft(prev => ({ ...prev, colorName: e.target.value }))}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Color Swatch (Hex)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={variantDraft.colorHex}
                        onChange={(e) => setVariantDraft(prev => ({ ...prev, colorHex: e.target.value }))}
                        className="w-9 h-9 p-0.5 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                      />
                      <Input
                        value={variantDraft.colorHex}
                        onChange={(e) => setVariantDraft(prev => ({ ...prev, colorHex: e.target.value }))}
                        placeholder="#F0A0C6"
                        className="text-xs rounded-xl uppercase font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Stock de esta variante</label>
                    <Input
                      type="number"
                      min="0"
                      value={variantDraft.stock}
                      onChange={(e) => setVariantDraft(prev => ({ ...prev, stock: intOrZero(e.target.value) }))}
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Foto propia del color</label>
                    <input
                      ref={variantFileInputRef}
                      type="file"
                      accept="image/*"
                      disabled={uploadingVariantImage}
                      onChange={handleVariantImageUpload}
                      className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-pink file:text-white hover:file:bg-brand-pink-dark cursor-pointer disabled:opacity-50 w-full"
                    />
                    {uploadingVariantImage && (
                      <p className="text-xs text-brand-pink font-medium mt-1 animate-pulse">Subiendo foto de variante...</p>
                    )}
                    {variantDraft.imageUrl && !uploadingVariantImage && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={variantDraft.imageUrl} alt="preview" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Imagen lista
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={addVariant}
                  disabled={!variantDraft.colorName.trim() || !variantDraft.imageUrl || uploadingVariantImage}
                  className="bg-brand-pink hover:bg-brand-pink-dark text-white text-xs font-bold rounded-xl w-full py-2.5 mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" /> Añadir Variante
                </Button>
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
                  onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, brandId: e.target.value }))}
                >
                  <option value="">Sin marca</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 space-y-4 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.active} onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))} className="rounded text-brand-pink focus:ring-brand-pink" />
                  <span className="text-sm font-medium">Producto Activo</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))} className="rounded text-brand-pink focus:ring-brand-pink" />
                  <span className="text-sm font-medium">
                    Destacado (Home)
                    <Tooltip text="Los productos destacados aparecen en la sección 'Lo más vendido' de la página de inicio." />
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2 flex justify-between items-center">
                Imágenes Generales
                <span className="text-xs text-gray-500 font-normal">{formData.imageUrls.length}/3</span>
              </h2>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                <p className="text-xs font-semibold text-amber-700 mb-1">
                  📸 Cómo agregar imágenes
                </p>
                <ol className="text-xs text-amber-700 space-y-0.5 list-decimal list-inside">
                  <li>Sube una foto directamente desde tu equipo abajo.</li>
                  <li>O selecciona fotos previamente subidas en <strong>"Bandeja"</strong>.</li>
                  <li>Máximo 3 imágenes por producto.</li>
                </ol>
              </div>

              {/* Direct File Upload */}
              <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subir imagen desde mi equipo
                </label>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={formData.imageUrls.length >= 3 || uploadingDirectImage}
                    onChange={handleDirectUpload}
                    className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-pink-light/40 file:text-brand-pink-dark hover:file:bg-brand-pink-light/70 cursor-pointer disabled:opacity-50 w-full"
                  />
                </div>
                {uploadingDirectImage && (
                  <p className="text-xs text-brand-pink font-medium mt-1 animate-pulse flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5" /> Procesando y subiendo imagen...
                  </p>
                )}
              </div>

              {/* Current Images */}
              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 pt-2">
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
