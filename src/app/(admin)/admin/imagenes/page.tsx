'use client';

import { useState, useEffect, useCallback } from 'react';
import { UploadCloud, Trash2, CheckCircle2, XCircle, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BandejaImage {
  id: string;
  url: string;
  filename: string;
  assigned: boolean;
  createdAt: string;
}

export default function AdminImagenesPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, success: 0, error: 0 });
  const [images, setImages] = useState<BandejaImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchImages = useCallback(async (currentPage = 1, currentFilter = filter) => {
    setLoading(true);
    let url = `/api/admin/imagenes?page=${currentPage}`;
    if (currentFilter === 'unassigned') url += '&assigned=false';
    if (currentFilter === 'assigned') url += '&assigned=true';

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.images) {
        setImages(data.images);
        setTotalPages(data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchImages(page, filter);
  }, [page, filter, fetchImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (filesArray.length > 50) {
        alert('Máximo 50 imágenes por vez');
        return;
      }
      setSelectedFiles(filesArray);
    }
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length, success: 0, error: 0 });

    let successCount = 0;
    let errorCount = 0;

    // Upload sequentially to avoid overloading the server/sharp process
    for (let i = 0; i < selectedFiles.length; i++) {
      setUploadProgress(prev => ({ ...prev, current: i + 1 }));
      const file = selectedFiles[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', 'product-images');

      try {
        const res = await fetch('/api/admin/imagenes/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
      setUploadProgress(prev => ({ ...prev, success: successCount, error: errorCount }));
    }

    alert(`Proceso terminado. Exitosas: ${successCount}, Errores: ${errorCount}`);
    setUploading(false);
    setSelectedFiles([]);
    fetchImages(1);
  };

  const deleteImage = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen?')) return;
    try {
      const res = await fetch(`/api/admin/imagenes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setImages(images.filter(img => img.id !== id));
      } else {
        alert('Error al eliminar la imagen');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-nunito text-gray-900">Bandeja de Imágenes</h1>
        <p className="text-gray-500">Sube imágenes masivamente para luego asignarlas a productos.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              id="image-upload"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <UploadCloud className="w-12 h-12 text-brand-pink" />
              <span className="font-medium text-gray-700">
                Selecciona hasta 50 imágenes
              </span>
              <span className="text-sm text-gray-500">PNG, JPG, WEBP (Máx 10MB c/u)</span>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm text-gray-700">
                  {selectedFiles.length} imágenes seleccionadas
                </span>
                <Button 
                  onClick={uploadFiles} 
                  disabled={uploading}
                  className="bg-brand-pink hover:bg-brand-pink-dark text-white"
                >
                  {uploading ? `Subiendo ${uploadProgress.current} / ${uploadProgress.total}...` : `Subir ${selectedFiles.length} imágenes`}
                </Button>
              </div>
              
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-brand-pink h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button 
          variant={filter === 'all' ? 'primary' : 'outline'} 
          onClick={() => { setFilter('all'); setPage(1); }}
          className={filter === 'all' ? 'bg-brand-pink hover:bg-brand-pink-dark' : ''}
        >
          Todas
        </Button>
        <Button 
          variant={filter === 'unassigned' ? 'primary' : 'outline'} 
          onClick={() => { setFilter('unassigned'); setPage(1); }}
          className={filter === 'unassigned' ? 'bg-brand-pink hover:bg-brand-pink-dark' : ''}
        >
          Sin Asignar
        </Button>
        <Button 
          variant={filter === 'assigned' ? 'primary' : 'outline'} 
          onClick={() => { setFilter('assigned'); setPage(1); }}
          className={filter === 'assigned' ? 'bg-brand-pink hover:bg-brand-pink-dark' : ''}
        >
          Asignadas
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 animate-pulse">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      ) : images.length > 0 ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={img.url} 
                  alt={img.filename} 
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex justify-end">
                    <button 
                      onClick={() => deleteImage(img.id)}
                      className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm"
                      title="Eliminar imagen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-white text-xs truncate drop-shadow-md font-medium" title={img.filename}>
                    {img.filename}
                  </p>
                </div>
                
                <div className="absolute top-2 left-2">
                  {img.assigned ? (
                    <div className="bg-green-500 text-white rounded-full p-1 shadow-sm" title="Asignada">
                      <CheckCircle2 size={14} />
                    </div>
                  ) : (
                    <div className="bg-orange-500 text-white rounded-full p-1 shadow-sm" title="Sin asignar">
                      <XCircle size={14} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 py-4">
              <Button 
                variant="outline" 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm font-medium text-gray-600">
                Página {page} de {totalPages}
              </span>
              <Button 
                variant="outline" 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No hay imágenes</h3>
          <p className="text-gray-500">Intenta subir algunas usando el botón de arriba.</p>
        </div>
      )}
    </div>
  );
}
