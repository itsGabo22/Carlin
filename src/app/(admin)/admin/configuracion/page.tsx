'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, UploadCloud, Image as ImageIcon, Video, Monitor, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminConfiguracionPage() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [config, setConfig] = useState({
    announcementText: '',
    announcementActive: false,
    wholesaleMinOrder: 200000,
    distributorMinOrder: 400000,
    inactivityDays: 30,
    heroUseVideo: false,
  });

  const [heroUploads, setHeroUploads] = useState({
    desktop: null as File | null,
    mobile: null as File | null,
    video: null as File | null,
  });

  // Construct base URL for previews assuming the standard Supabase structure
  const storageBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL 
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/hero-media/hero` 
    : '';

  useEffect(() => {
    fetch('/api/admin/configuracion')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setConfig({
            announcementText: data.announcementText || '',
            announcementActive: data.announcementActive || false,
            wholesaleMinOrder: parseFloat(data.wholesaleMinOrder) || 200000,
            distributorMinOrder: parseFloat(data.distributorMinOrder) || 400000,
            inactivityDays: data.inactivityDays || 30,
            heroUseVideo: data.heroUseVideo || false,
          });
        }
      })
      .finally(() => setFetching(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append('wholesaleMinOrder', config.wholesaleMinOrder.toString());
      fd.append('distributorMinOrder', config.distributorMinOrder.toString());
      fd.append('inactivityDays', config.inactivityDays.toString());
      fd.append('announcementText', config.announcementText);
      fd.append('announcementActive', config.announcementActive.toString());
      fd.append('heroUseVideo', config.heroUseVideo.toString());

      if (heroUploads.desktop) fd.append('desktop', heroUploads.desktop);
      if (heroUploads.mobile) fd.append('mobile', heroUploads.mobile);
      if (heroUploads.video) fd.append('video', heroUploads.video);

      const resConfig = await fetch('/api/admin/configuracion', {
        method: 'PATCH',
        body: fd
      });

      if (resConfig.ok) {
        alert('Configuración guardada exitosamente');
        setHeroUploads({ desktop: null, mobile: null, video: null }); // Reset file inputs
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

  if (fetching) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-nunito text-gray-900 flex items-center gap-2">
            <Settings className="text-brand-pink" /> Configuración General
          </h1>
          <p className="text-gray-500">Ajusta reglas de negocio, montos y banners principales.</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2">
          <Save size={16} />
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
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

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-semibold">Hero Principal (Home)</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={config.heroUseVideo} 
                  onChange={e => setConfig({...config, heroUseVideo: e.target.checked})}
                  className="rounded text-brand-pink focus:ring-brand-pink" 
                />
                <span className="text-sm font-medium">Usar Video de Fondo</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50 flex flex-col justify-between">
                <div>
                  <Monitor className="w-8 h-8 text-brand-pink mx-auto mb-2" />
                  <span className="font-medium text-sm text-gray-700 block">Imagen Desktop</span>
                  <p className="text-xs text-gray-400 mb-4">Resolución sugerida: 1920x1080</p>
                  
                  {storageBaseUrl && (
                    <div className="mb-4 aspect-video bg-gray-200 rounded-md overflow-hidden relative">
                      <img src={`${storageBaseUrl}/desktop.webp?t=${Date.now()}`} alt="Desktop Preview" className="object-cover w-full h-full" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
                <div>
                  <input 
                    type="file" 
                    id="hero-desktop"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setHeroUploads({...heroUploads, desktop: e.target.files?.[0] || null})}
                  />
                  <label htmlFor="hero-desktop" className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 w-full text-sm">
                    <UploadCloud size={16} /> Subir
                  </label>
                  {heroUploads.desktop && <p className="text-xs text-green-600 mt-2 truncate">{heroUploads.desktop.name}</p>}
                </div>
              </div>

              <div className="space-y-2 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50 flex flex-col justify-between">
                <div>
                  <Smartphone className="w-8 h-8 text-brand-pink mx-auto mb-2" />
                  <span className="font-medium text-sm text-gray-700 block">Imagen Mobile (9:16)</span>
                  <p className="text-xs text-gray-400 mb-4">Resolución sugerida: 1080x1920</p>
                  
                  {storageBaseUrl && (
                    <div className="mb-4 w-1/2 mx-auto aspect-[9/16] bg-gray-200 rounded-md overflow-hidden relative">
                      <img src={`${storageBaseUrl}/mobile.webp?t=${Date.now()}`} alt="Mobile Preview" className="object-cover w-full h-full" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
                <div>
                  <input 
                    type="file" 
                    id="hero-mobile"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setHeroUploads({...heroUploads, mobile: e.target.files?.[0] || null})}
                  />
                  <label htmlFor="hero-mobile" className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 w-full text-sm">
                    <UploadCloud size={16} /> Subir
                  </label>
                  {heroUploads.mobile && <p className="text-xs text-green-600 mt-2 truncate">{heroUploads.mobile.name}</p>}
                </div>
              </div>

              <div className="space-y-2 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50 flex flex-col justify-between">
                <div>
                  <Video className="w-8 h-8 text-brand-pink mx-auto mb-2" />
                  <span className="font-medium text-sm text-gray-700 block">Video de Fondo</span>
                  <p className="text-xs text-gray-400 mb-4">mp4 o webm, Max: 100MB</p>
                  
                  {storageBaseUrl && (
                    <div className="mb-4 aspect-video bg-gray-200 rounded-md overflow-hidden relative">
                      <video src={`${storageBaseUrl}/video.webm?t=${Date.now()}`} className="object-cover w-full h-full" muted playsInline />
                    </div>
                  )}
                </div>
                <div>
                  <input 
                    type="file" 
                    id="hero-video"
                    accept="video/mp4, video/webm"
                    className="hidden"
                    onChange={e => setHeroUploads({...heroUploads, video: e.target.files?.[0] || null})}
                  />
                  <label htmlFor="hero-video" className="cursor-pointer inline-flex items-center justify-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 w-full text-sm">
                    <UploadCloud size={16} /> Subir
                  </label>
                  {heroUploads.video && <p className="text-xs text-green-600 mt-2 truncate">{heroUploads.video.name}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
