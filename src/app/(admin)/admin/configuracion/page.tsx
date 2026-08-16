'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, UploadCloud, Monitor, Smartphone, Video, Plus, ArrowUp, ArrowDown, Trash2, Edit, Image as ImageIcon, Sparkles, Eye, EyeOff, Gift } from 'lucide-react';
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
    catalogMaquillajeUrl: '',
    catalogCapilarUrl: '',
    welcomeDiscountActive: false,
    welcomeDiscountPercentage: 10,
    welcomeTitle: '',
    welcomeMessage: '',
    welcomeImageUrl: '',
  });
  const [welcomeImage, setWelcomeImage] = useState<File | null>(null);
  const [removeWelcomeImage, setRemoveWelcomeImage] = useState(false);

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

  const [marquees, setMarquees] = useState<any[]>([]);
  const [marqueeModalOpen, setMarqueeModalOpen] = useState(false);
  const [editingMarqueeId, setEditingMarqueeId] = useState<string | null>(null);
  const [marqueeForm, setMarqueeForm] = useState({
    message: '',
    active: true,
  });

  const [popupLoading, setPopupLoading] = useState(false);
  const [popup, setPopup] = useState({
    active: false,
    imageUrl: '',
    title: '',
    subtitle: '',
    ctaText: 'Ver oferta',
    ctaHref: '',
    showOnce: true,
  });
  const [popupImage, setPopupImage] = useState<File | null>(null);

  const loadData = () => {
    setFetching(true);
    Promise.all([
      fetch('/api/admin/configuracion').then(r => r.json()),
      fetch('/api/admin/hero-slides').then(r => r.json()),
      fetch('/api/admin/promo-popup').then(r => r.json()),
      fetch('/api/admin/marquee').then(r => r.json())
    ]).then(([configData, slidesData, popupData, marqueeData]) => {
      if (configData && !configData.error) {
        setConfig({
          announcementText: configData.announcementText || '',
          announcementActive: configData.announcementActive || false,
          wholesaleMinOrder: parseFloat(configData.wholesaleMinOrder) || 200000,
          distributorMinOrder: parseFloat(configData.distributorMinOrder) || 400000,
          inactivityDays: configData.inactivityDays || 30,
          catalogMaquillajeUrl: configData.catalogMaquillajeUrl || '',
          catalogCapilarUrl: configData.catalogCapilarUrl || '',
          welcomeDiscountActive: configData.welcomeDiscountActive || false,
          welcomeDiscountPercentage: parseFloat(configData.welcomeDiscountPercentage) || 0,
          welcomeTitle: configData.welcomeTitle || '',
          welcomeMessage: configData.welcomeMessage || '',
          welcomeImageUrl: configData.welcomeImageUrl || '',
        });
        setWelcomeImage(null);
        setRemoveWelcomeImage(false);
      }
      if (slidesData && Array.isArray(slidesData)) {
        setSlides(slidesData);
      }
      if (popupData && !popupData.error) {
        setPopup({
          active: popupData.active || false,
          imageUrl: popupData.imageUrl || '',
          title: popupData.title || '',
          subtitle: popupData.subtitle || '',
          ctaText: popupData.ctaText || 'Ver oferta',
          ctaHref: popupData.ctaHref || '',
          showOnce: popupData.showOnce ?? true,
        });
      }
      if (marqueeData && Array.isArray(marqueeData)) {
        setMarquees(marqueeData);
      }
    }).finally(() => setFetching(false));
  };

  const handleSavePopup = async (e: React.FormEvent) => {
    e.preventDefault();
    setPopupLoading(true);
    try {
      const fd = new FormData();
      fd.append('active', popup.active.toString());
      fd.append('title', popup.title);
      fd.append('subtitle', popup.subtitle);
      fd.append('ctaText', popup.ctaText);
      fd.append('ctaHref', popup.ctaHref);
      fd.append('showOnce', popup.showOnce.toString());
      if (popupImage) fd.append('image', popupImage);

      const res = await fetch('/api/admin/promo-popup', { method: 'PATCH', body: fd });
      if (res.ok) {
        const updated = await res.json();
        setPopup(p => ({ ...p, imageUrl: updated.imageUrl || p.imageUrl }));
        setPopupImage(null);
        alert('Popup promocional guardado exitosamente');
      } else {
        alert('Error al guardar el popup');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setPopupLoading(false);
    }
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
      fd.append('catalogMaquillajeUrl', config.catalogMaquillajeUrl);
      fd.append('catalogCapilarUrl', config.catalogCapilarUrl);
      fd.append('welcomeDiscountActive', config.welcomeDiscountActive.toString());
      fd.append('welcomeDiscountPercentage', config.welcomeDiscountPercentage.toString());
      fd.append('welcomeTitle', config.welcomeTitle);
      fd.append('welcomeMessage', config.welcomeMessage);
      if (welcomeImage) fd.append('welcomeImage', welcomeImage);
      if (removeWelcomeImage) fd.append('removeWelcomeImage', 'true');

      const resConfig = await fetch('/api/admin/configuracion', {
        method: 'PATCH',
        body: fd
      });

      if (resConfig.ok) {
        const updated = await resConfig.json();
        setConfig(prev => ({ ...prev, welcomeImageUrl: updated.welcomeImageUrl || '' }));
        setWelcomeImage(null);
        setRemoveWelcomeImage(false);
        alert('Configuración guardada exitosamente');
      } else {
        alert('Error al guardar la configuración');
      }
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

  const handleToggleSlideActive = async (slide: any) => {
    try {
      const fd = new FormData();
      fd.append('active', (!slide.active).toString());
      const res = await fetch(`/api/admin/hero-slides/${slide.id}`, { method: 'PATCH', body: fd });
      if (res.ok) {
        setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, active: !slide.active } : s));
      } else {
        alert('Error al actualizar el slide');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
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

  const openNewMarqueeModal = () => {
    setEditingMarqueeId(null);
    setMarqueeForm({ message: '', active: true });
    setMarqueeModalOpen(true);
  };

  const openEditMarqueeModal = (mq: any) => {
    setEditingMarqueeId(mq.id);
    setMarqueeForm({ message: mq.message, active: mq.active });
    setMarqueeModalOpen(true);
  };

  const handleSaveMarquee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('message', marqueeForm.message);
      fd.append('active', marqueeForm.active.toString());

      const url = editingMarqueeId ? `/api/admin/marquee/${editingMarqueeId}` : '/api/admin/marquee';
      const method = editingMarqueeId ? 'PATCH' : 'POST';

      const res = await fetch(url, { method, body: fd });
      if (res.ok) {
        setMarqueeModalOpen(false);
        loadData();
      } else {
        alert('Error al guardar marquee');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMarqueeActive = async (mq: any) => {
    try {
      const fd = new FormData();
      fd.append('active', (!mq.active).toString());
      const res = await fetch(`/api/admin/marquee/${mq.id}`, { method: 'PATCH', body: fd });
      if (res.ok) {
        setMarquees(prev => prev.map(m => m.id === mq.id ? { ...m, active: !mq.active } : m));
      } else {
        alert('Error al actualizar el marquee');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  const handleDeleteMarquee = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;
    try {
      const res = await fetch(`/api/admin/marquee/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleReorderMarquee = async (index: number, direction: 'up' | 'down') => {
    const newMqs = [...marquees];
    if (direction === 'up' && index > 0) {
      [newMqs[index - 1], newMqs[index]] = [newMqs[index], newMqs[index - 1]];
    } else if (direction === 'down' && index < newMqs.length - 1) {
      [newMqs[index + 1], newMqs[index]] = [newMqs[index], newMqs[index + 1]];
    } else return;
    
    const updated = newMqs.map((m, i) => ({ ...m, order: i }));
    setMarquees(updated);
    
    fetch('/api/admin/marquee/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: updated.map(m => ({ id: m.id, order: m.order })) })
    });
  };

  if (fetching) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-gray-900 flex items-center gap-2">
            <Settings className="text-brand-pink shrink-0" /> Configuración General
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Ajusta reglas de negocio, montos y banners principales.</p>
        </div>
        <Button onClick={handleSaveConfig} disabled={loading} className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2 h-10 w-full sm:w-auto">
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
            <h2 className="text-lg font-semibold border-b pb-2">Catálogos Mayoristas</h2>
            <p className="text-sm text-gray-500">URLs de los catálogos Canva o PDF que aparecen en el menú de navegación.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Catálogo Maquillaje (URL)</label>
                <Input 
                  value={config.catalogMaquillajeUrl} 
                  onChange={e => setConfig({...config, catalogMaquillajeUrl: e.target.value})} 
                  placeholder="https://www.canva.com/design/..." 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Catálogo Capilar / Cuidado Cabello (URL)</label>
                <Input 
                  value={config.catalogCapilarUrl} 
                  onChange={e => setConfig({...config, catalogCapilarUrl: e.target.value})} 
                  placeholder="https://www.canva.com/design/..." 
                />
              </div>
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
            <p className="text-xs text-gray-500">
              Un mayorista aprobado que aún no ha hecho su primera compra conserva sus precios
              especiales durante estos mismos días, contados desde su aprobación.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
              <Gift size={18} className="text-brand-pink" /> Descuento de Bienvenida
            </h2>
            <p className="text-sm text-gray-500">
              Se aplica solo <strong>una vez</strong> y de forma automática (sin cupón) en el
              <strong> primer pedido</strong> de un mayorista aprobado. No aplica a distribuidores.
            </p>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.welcomeDiscountActive}
                onChange={e => setConfig({ ...config, welcomeDiscountActive: e.target.checked })}
                className="rounded text-brand-pink focus:ring-brand-pink"
              />
              <span className="text-sm font-medium">Activar descuento de bienvenida</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Porcentaje (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={config.welcomeDiscountPercentage}
                  onChange={e => setConfig({ ...config, welcomeDiscountPercentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            {config.welcomeDiscountActive && !(config.welcomeDiscountPercentage > 0) && (
              <p className="text-xs text-orange-600 font-medium">
                El descuento está activo pero el porcentaje es 0: no se aplicará nada.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-brand-pink" /> Panel de Bienvenida
            </h2>
            <p className="text-sm text-gray-500">
              Es la pantalla que ve el mayorista <strong>una sola vez</strong>, la primera vez que
              entra después de que apruebes su cuenta. Si dejas los campos vacíos se usan los
              textos por defecto.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">Título</label>
              <Input
                value={config.welcomeTitle}
                onChange={e => setConfig({ ...config, welcomeTitle: e.target.value })}
                placeholder="Ej: ¡Bienvenida, {nombre}!"
              />
              <p className="text-xs text-gray-500">
                Escribe <code className="bg-gray-100 px-1 rounded">{'{nombre}'}</code> donde quieras
                que aparezca el nombre del cliente. Si la cuenta no tiene nombre, se quita solo.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mensaje</label>
              <textarea
                value={config.welcomeMessage}
                onChange={e => setConfig({ ...config, welcomeMessage: e.target.value })}
                placeholder="Ej: Gracias por unirte a nuestra familia de mayoristas. Estamos felices de tenerte."
                rows={3}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
              />
              <p className="text-xs text-gray-500">
                Se muestra debajo del saludo. Los saltos de línea se respetan.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen de bienvenida (opcional)</label>
              <p className="text-xs text-gray-500">
                Si subes un diseño propio, <strong>reemplaza la cabecera rosada</strong> y se muestra
                sin ningún texto encima, para que no se cruce con tu diseño. El saludo y el resto
                pasan debajo. Recomendado 1200×600.
              </p>

              <div className="relative border-2 border-dashed border-gray-200 hover:border-brand-pink hover:bg-brand-pink/5 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group max-w-sm">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={e => {
                    setWelcomeImage(e.target.files?.[0] || null);
                    setRemoveWelcomeImage(false);
                  }}
                />
                {config.welcomeImageUrl && !welcomeImage && !removeWelcomeImage ? (
                  <img src={config.welcomeImageUrl} alt="Bienvenida" className="w-full rounded-lg mb-3" />
                ) : (
                  <UploadCloud className="text-gray-400 group-hover:text-brand-pink mb-3 transition-colors" size={40} strokeWidth={1.5} />
                )}
                <p className="text-sm font-semibold text-gray-700">
                  {removeWelcomeImage ? 'Se quitará al guardar' : 'Imagen del panel'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {welcomeImage ? welcomeImage.name : 'Haz clic o arrastra tu archivo'}
                </p>
              </div>

              {(config.welcomeImageUrl || welcomeImage) && !removeWelcomeImage && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    setWelcomeImage(null);
                    setRemoveWelcomeImage(true);
                  }}
                >
                  Quitar imagen y volver al diseño rosado
                </Button>
              )}
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
                <div key={slide.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex-shrink-0 w-20 sm:w-24 h-14 sm:h-16 bg-gray-200 rounded-lg overflow-hidden border border-gray-200">
                      {slide.type === 'IMAGE' ? (
                        <img src={slide.desktopUrl} alt="Slide preview" className="w-full h-full object-cover" />
                      ) : (
                        <video src={slide.desktopUrl} className="w-full h-full object-cover" muted />
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm flex items-center gap-1.5 text-gray-900 truncate">
                        {slide.type === 'IMAGE' ? <ImageIcon size={14} className="text-blue-500 shrink-0" /> : <Video size={14} className="text-brand-distributor-dark shrink-0" />}
                        <span className="truncate">{slide.title || 'Sin Título'}</span>
                      </p>
                      <p className="text-xs text-gray-500 truncate">{slide.subtitle || 'Sin Subtítulo'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-gray-200">
                    {slide.active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-green-100 text-green-800">Activo</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-gray-100 text-gray-800">Inactivo</span>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleSlideActive(slide)}
                        title={slide.active ? 'Ocultar slide' : 'Mostrar slide'}
                      >
                        {slide.active ? <Eye size={16} className="text-green-600" /> : <EyeOff size={16} className="text-gray-400" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReorder(idx, 'up')} disabled={idx === 0}><ArrowUp size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReorder(idx, 'down')} disabled={idx === slides.length - 1}><ArrowDown size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditSlideModal(slide)}><Edit size={16} className="text-blue-600" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteSlide(slide.id)}><Trash2 size={16} className="text-red-600" /></Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <div>
              <h2 className="text-xl font-bold">Marquee (Cinta de mensajes)</h2>
              <p className="text-sm text-gray-500">Mensajes de texto que se desplazan infinitamente en la barra de navegación.</p>
            </div>
            <Button onClick={openNewMarqueeModal} className="bg-brand-pink hover:bg-brand-pink-dark">
              <Plus size={16} className="mr-2" /> Nuevo Mensaje
            </Button>
          </div>

          <div className="space-y-2">
            {marquees.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No hay mensajes configurados.</p>
            ) : (
              marquees.map((mq, idx) => (
                <div key={mq.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex-1 truncate text-sm font-medium text-gray-900">
                    {mq.message}
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-gray-200">
                    {mq.active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-green-100 text-green-800">Activo</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-gray-100 text-gray-800">Inactivo</span>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleMarqueeActive(mq)}
                        title={mq.active ? 'Ocultar mensaje' : 'Mostrar mensaje'}
                      >
                        {mq.active ? <Eye size={16} className="text-green-600" /> : <EyeOff size={16} className="text-gray-400" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReorderMarquee(idx, 'up')} disabled={idx === 0}><ArrowUp size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReorderMarquee(idx, 'down')} disabled={idx === marquees.length - 1}><ArrowDown size={16} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditMarqueeModal(mq)}><Edit size={16} className="text-blue-600" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteMarquee(mq.id)}><Trash2 size={16} className="text-red-600" /></Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles size={18} className="text-brand-pink" /> Popup Promocional
            </h2>
            <Button onClick={handleSavePopup} disabled={popupLoading} size="sm" className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2">
              <Save size={16} />
              {popupLoading ? 'Guardando...' : 'Guardar Popup'}
            </Button>
          </div>

          <form onSubmit={handleSavePopup} className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={popup.active}
                onChange={e => setPopup({ ...popup, active: e.target.checked })}
                className="rounded text-brand-pink focus:ring-brand-pink"
              />
              <span className="text-sm font-medium">Popup activo (se muestra al entrar al sitio)</span>
            </label>

            <div className="relative border-2 border-dashed border-gray-200 hover:border-brand-pink hover:bg-brand-pink/5 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group max-w-sm">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                onChange={e => setPopupImage(e.target.files?.[0] || null)}
              />
              {popup.imageUrl && !popupImage ? (
                <img src={popup.imageUrl} alt="Popup preview" className="w-full h-32 object-cover rounded-lg mb-3" />
              ) : (
                <UploadCloud className="text-gray-400 group-hover:text-brand-pink mb-3 transition-colors" size={40} strokeWidth={1.5} />
              )}
              <p className="text-sm font-semibold text-gray-700">Imagen del popup</p>
              <p className="text-xs text-gray-500 mt-1">{popupImage ? popupImage.name : 'Haz clic o arrastra tu archivo'}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input value={popup.title} onChange={e => setPopup({ ...popup, title: e.target.value })} placeholder="Ej: ¡20% OFF en brochas!" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subtítulo</label>
                <Input value={popup.subtitle} onChange={e => setPopup({ ...popup, subtitle: e.target.value })} placeholder="Ej: Solo por tiempo limitado" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Texto del botón</label>
                <Input value={popup.ctaText} onChange={e => setPopup({ ...popup, ctaText: e.target.value })} placeholder="Ej: Ver brochas" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Link del botón</label>
                <Input value={popup.ctaHref} onChange={e => setPopup(prev => ({ ...prev, ctaHref: e.target.value }))} placeholder="Ej: /catalogo/brochas-y-herramientas" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={popup.showOnce}
                onChange={e => setPopup(prev => ({ ...prev, showOnce: e.target.checked }))}
                className="rounded text-brand-pink focus:ring-brand-pink"
              />
              <span className="text-sm font-medium">Mostrar solo una vez por sesión (no reaparece tras cerrarlo)</span>
            </label>
          </form>
        </CardContent>
      </Card>

      <Modal isOpen={slideModalOpen} onClose={() => setSlideModalOpen(false)} title={editingSlideId ? "Editar Slide" : "Nuevo Slide"}>
        <form onSubmit={handleSaveSlide} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Medio</label>
            <select 
              value={slideForm.type} 
              onChange={e => setSlideForm(prev => ({ ...prev, type: e.target.value }))}
              className="w-full h-10 px-3 rounded-md border border-gray-200"
            >
              <option value="IMAGE">Imagen</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Título (Opcional)</label>
              <Input value={slideForm.title} onChange={e => setSlideForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Texto principal del hero (ej: Nueva Colección de Verano)" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subtítulo (Opcional)</label>
              <Input value={slideForm.subtitle} onChange={e => setSlideForm(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="Párrafo descriptivo (ej: Descubre nuestros nuevos productos)" />
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Si dejas estos campos vacíos, se mostrará el texto por defecto de la tienda.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Botón (Opcional)</label>
              <Input value={slideForm.ctaText} onChange={e => setSlideForm(prev => ({ ...prev, ctaText: e.target.value }))} placeholder="Ej: Ver más" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Link Botón (Opcional)</label>
              <Input value={slideForm.ctaHref} onChange={e => setSlideForm(prev => ({ ...prev, ctaHref: e.target.value }))} placeholder="Ej: /catalogo" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            {slideForm.type === 'IMAGE' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative border-2 border-dashed border-gray-200 hover:border-brand-pink hover:bg-brand-pink/5 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={e => {
                    const f = e.target.files?.[0] || null;
                    setSlideUploads(prev => ({ ...prev, desktop: f }));
                  }} />
                  <Monitor className="text-gray-400 group-hover:text-brand-pink mb-3 transition-colors" size={40} strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-gray-700">Desktop (1920x1080)</p>
                  <p className="text-xs text-gray-500 mt-1">{slideUploads.desktop ? slideUploads.desktop.name : 'Haz clic o arrastra'}</p>
                </div>
                <div className="relative border-2 border-dashed border-gray-200 hover:border-brand-pink hover:bg-brand-pink/5 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={e => {
                    const f = e.target.files?.[0] || null;
                    setSlideUploads(prev => ({ ...prev, mobile: f }));
                  }} />
                  <Smartphone className="text-gray-400 group-hover:text-brand-pink mb-3 transition-colors" size={40} strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-gray-700">Mobile (1080x1920)</p>
                  <p className="text-xs text-gray-500 mt-1">{slideUploads.mobile ? slideUploads.mobile.name : 'Opcional, haz clic aquí'}</p>
                </div>
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-gray-200 hover:border-brand-distributor hover:bg-brand-distributor/10 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                <input type="file" accept="video/mp4, video/webm" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={e => {
                  const f = e.target.files?.[0] || null;
                  setSlideUploads(prev => ({ ...prev, video: f }));
                }} />
                <Video className="text-gray-400 group-hover:text-brand-distributor mb-3 transition-colors" size={48} strokeWidth={1.5} />
                <p className="text-sm font-semibold text-gray-700">Subir Video (MP4/WebM)</p>
                <p className="text-xs text-gray-500 mt-1">{slideUploads.video ? slideUploads.video.name : 'Haz clic o arrastra tu archivo'}</p>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={slideForm.active}
              onChange={e => setSlideForm(prev => ({ ...prev, active: e.target.checked }))}
              className="rounded text-brand-pink focus:ring-brand-pink"
            />
            <span className="text-sm font-medium">Slide activo (visible en la tienda)</span>
          </label>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setSlideModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-brand-pink hover:bg-brand-pink-dark text-white">
              {loading ? 'Guardando...' : 'Guardar Slide'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={marqueeModalOpen} onClose={() => setMarqueeModalOpen(false)} title={editingMarqueeId ? 'Editar Mensaje' : 'Nuevo Mensaje'}>
        <form onSubmit={handleSaveMarquee} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mensaje</label>
            <Input 
              value={marqueeForm.message} 
              onChange={e => setMarqueeForm(prev => ({ ...prev, message: e.target.value }))} 
              placeholder="Ej: ENVÍO GRATIS POR COMPRAS SUPERIORES A $200.000" 
              required
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={marqueeForm.active}
              onChange={e => setMarqueeForm(prev => ({ ...prev, active: e.target.checked }))}
              className="rounded text-brand-pink focus:ring-brand-pink"
            />
            <span className="text-sm font-medium">Mensaje activo</span>
          </label>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setMarqueeModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-brand-pink hover:bg-brand-pink-dark text-white">
              {loading ? 'Guardando...' : 'Guardar Mensaje'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
