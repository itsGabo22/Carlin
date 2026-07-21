'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, UploadCloud, Monitor, Smartphone, Video, Plus, ArrowUp, ArrowDown, Trash2, Edit, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';

export default function AdminConfiguracionPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [config, setConfig] = useState({
    announcementText: '',
    announcementActive: false,
    wholesaleMinOrder: 200000,
    distributorMinOrder: 400000,
    inactivityDays: 30,
  });

  const [slides, setSlides] = useState<any[]>([]);
  const [slideModalOpen, setSlideModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  
  const [slideForm, setSlideForm] = useState({
    type: 'IMAGE',
    title: '',
    subtitle: '',
    ctaText: '',
    ctaHref: '',
    active: true,
  });
  
  const [slideUploads, setSlideUploads] = useState({
    desktop: null as File | null,
    mobile: null as File | null,
    video: null as File | null,
  });

  const loadData = () => {
    setFetching(true);
    Promise.all([
      fetch('/api/admin/configuracion').then(r => r.json()),
      fetch('/api/admin/hero-slides').then(r => r.json())
    ]).then(([configData, slidesData]) => {
      if (configData && !configData.error) {
        setConfig({
          announcementText: configData.announcementText || '',
          announcementActive: configData.announcementActive || false,
          wholesaleMinOrder: parseFloat(configData.wholesaleMinOrder) || 200000,
          distributorMinOrder: parseFloat(configData.distributorMinOrder) || 400000,
          inactivityDays: configData.inactivityDays || 30,
        });
      }
      if (slidesData && Array.isArray(slidesData)) {
        setSlides(slidesData);
      }
    }).finally(() => setFetching(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('wholesaleMinOrder', config.wholesaleMinOrder.toString());
      fd.append('distributorMinOrder', config.distributorMinOrder.toString());
      fd.append('inactivityDays', config.inactivityDays.toString());
      fd.append('announcementText', config.announcementText);
      fd.append('announcementActive', config.announcementActive.toString());

      const resConfig = await fetch('/api/admin/configuracion', {
        method: 'PATCH',
        body: fd
      });

      if (resConfig.ok) alert('Configuración guardada exitosamente');
      else alert('Error al guardar la configuración');
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const openNewSlideModal = () => {
    setEditingSlideId(null);
    setSlideForm({ type: 'IMAGE', title: '', subtitle: '', ctaText: '', ctaHref: '', active: true });
    setSlideUploads({ desktop: null, mobile: null, video: null });
    setSlideModalOpen(true);
  };

  const openEditSlideModal = (slide: any) => {
    setEditingSlideId(slide.id);
    setSlideForm({
      type: slide.type,
      title: slide.title || '',
      subtitle: slide.subtitle || '',
      ctaText: slide.ctaText || '',
      ctaHref: slide.ctaHref || '',
      active: slide.active,
    });
    setSlideUploads({ desktop: null, mobile: null, video: null });
    setSlideModalOpen(true);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!editingSlideId) {
        if (slideForm.type === 'IMAGE' && !slideUploads.desktop) {
          alert('Debes subir una imagen desktop');
          setLoading(false); return;
        }
        if (slideForm.type === 'VIDEO' && !slideUploads.video) {
          alert('Debes subir un video');
          setLoading(false); return;
        }
      }
      
      const fd = new FormData();
      fd.append('type', slideForm.type);
      fd.append('title', slideForm.title);
      fd.append('subtitle', slideForm.subtitle);
      fd.append('ctaText', slideForm.ctaText);
      fd.append('ctaHref', slideForm.ctaHref);
      fd.append('active', slideForm.active.toString());
      
      if (slideUploads.desktop) fd.append('desktop', slideUploads.desktop);
      if (slideUploads.mobile) fd.append('mobile', slideUploads.mobile);
      if (slideUploads.video) fd.append('video', slideUploads.video);

      const url = editingSlideId ? `/api/admin/hero-slides/${editingSlideId}` : '/api/admin/hero-slides';
      const method = editingSlideId ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, body: fd });
      if (res.ok) {
        setSlideModalOpen(false);
        loadData();
      } else {
        alert('Error al guardar slide');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este slide?')) return;
    try {
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newSlides = [...slides];
    if (direction === 'up' && index > 0) {
      [newSlides[index - 1], newSlides[index]] = [newSlides[index], newSlides[index - 1]];
    } else if (direction === 'down' && index < newSlides.length - 1) {
      [newSlides[index + 1], newSlides[index]] = [newSlides[index], newSlides[index + 1]];
    } else return;
    
    const updated = newSlides.map((s, i) => ({ ...s, order: i }));
    setSlides(updated);
    
    fetch('/api/admin/hero-slides/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slides: updated.map(s => ({ id: s.id, order: s.order })) })
    });
  };

  if (fetching) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-nunito text-gray-900 flex items-center gap-2">
            <Settings className="text-brand-pink" /> Configuración General
          </h1>
          <p className="text-gray-500">Ajusta reglas de negocio, montos y banners principales.</p>
        </div>
        <Button onClick={handleSaveConfig} disabled={loading} className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2">
          <Save size={16} />
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>

      <form onSubmit={handleSaveConfig} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Banner Superior (Anuncio)</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Texto del anuncio</label>
                <Input 
                  value={config.announcementText} 
                  onChange={e => setConfig({...config, announcementText: e.target.value})} 
                  placeholder="Ej: ¡Envío gratis por compras superiores a $100.000!" 
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.announcementActive} 
                  onChange={e => setConfig({...config, announcementActive: e.target.checked})}
                  className="rounded text-brand-pink focus:ring-brand-pink" 
                />
                <span className="text-sm font-medium">Mostrar banner en la tienda</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Reglas de Mayoristas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mínimo Mayorista ($)</label>
                <Input 
                  type="number" 
                  required 
                  value={config.wholesaleMinOrder} 
                  onChange={e => setConfig({...config, wholesaleMinOrder: parseFloat(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Mínimo Distribuidor ($)</label>
                <Input 
                  type="number" 
                  required 
                  value={config.distributorMinOrder} 
                  onChange={e => setConfig({...config, distributorMinOrder: parseFloat(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Días de inactividad</label>
                <Input 
                  type="number" 
                  required 
                  value={config.inactivityDays} 
                  onChange={e => setConfig({...config, inactivityDays: parseInt(e.target.value)})} 
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold">Slides del Hero (Home)</h2>
            <Button onClick={openNewSlideModal} variant="outline" size="sm" className="gap-2">
              <Plus size={16} /> Añadir Slide
            </Button>
          </div>
          
          <div className="space-y-4">
            {slides.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No hay slides configurados. Se mostrará el fondo por defecto.</p>
            ) : (
              slides.map((slide, idx) => (
                <div key={slide.id} className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex-shrink-0 w-24 h-16 bg-gray-200 rounded overflow-hidden">
                    {slide.type === 'IMAGE' ? (
                      <img src={slide.desktopUrl} alt="Slide preview" className="w-full h-full object-cover" />
                    ) : (
                      <video src={slide.desktopUrl} className="w-full h-full object-cover" muted />
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <p className="font-medium text-sm flex items-center gap-2">
                      {slide.type === 'IMAGE' ? <ImageIcon size={14} className="text-blue-500" /> : <Video size={14} className="text-purple-500" />}
                      {slide.title || 'Sin Título'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{slide.subtitle || 'Sin Subtítulo'}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleReorder(idx, 'up')} disabled={idx === 0}><ArrowUp size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleReorder(idx, 'down')} disabled={idx === slides.length - 1}><ArrowDown size={16} /></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditSlideModal(slide)}><Edit size={16} className="text-blue-600" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSlide(slide.id)}><Trash2 size={16} className="text-red-600" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={slideModalOpen} onClose={() => setSlideModalOpen(false)} title={editingSlideId ? "Editar Slide" : "Nuevo Slide"}>
        <form onSubmit={handleSaveSlide} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Medio</label>
            <select 
              value={slideForm.type} 
              onChange={e => setSlideForm({...slideForm, type: e.target.value})}
              className="w-full h-10 px-3 rounded-md border border-gray-200"
            >
              <option value="IMAGE">Imagen</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título (Opcional)</label>
              <Input value={slideForm.title} onChange={e => setSlideForm({...slideForm, title: e.target.value})} placeholder="Ej: Nueva Colección" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subtítulo (Opcional)</label>
              <Input value={slideForm.subtitle} onChange={e => setSlideForm({...slideForm, subtitle: e.target.value})} placeholder="Ej: Descubre lo último" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Botón (Opcional)</label>
              <Input value={slideForm.ctaText} onChange={e => setSlideForm({...slideForm, ctaText: e.target.value})} placeholder="Ej: Ver más" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Link Botón (Opcional)</label>
              <Input value={slideForm.ctaHref} onChange={e => setSlideForm({...slideForm, ctaHref: e.target.value})} placeholder="Ej: /catalogo" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            {slideForm.type === 'IMAGE' ? (
              <>
                <div>
                  <label className="text-sm font-medium block mb-2">Imagen Desktop (Requerido)</label>
                  <input type="file" accept="image/*" onChange={e => setSlideUploads({...slideUploads, desktop: e.target.files?.[0] || null})} />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Imagen Mobile (Opcional, 9:16)</label>
                  <input type="file" accept="image/*" onChange={e => setSlideUploads({...slideUploads, mobile: e.target.files?.[0] || null})} />
                </div>
              </>
            ) : (
              <div>
                <label className="text-sm font-medium block mb-2">Archivo Video (mp4/webm)</label>
                <input type="file" accept="video/mp4, video/webm" onChange={e => setSlideUploads({...slideUploads, video: e.target.files?.[0] || null})} />
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setSlideModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-brand-pink hover:bg-brand-pink-dark text-white">
              {loading ? 'Guardando...' : 'Guardar Slide'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
