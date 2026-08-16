'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Import, Download, UploadCloud, AlertCircle, X } from 'lucide-react';

export function CsvImportModal() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'download' | 'upload'>('download');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ valid: any[], errors: any[] } | null>(null);
  const [uploading, setUploading] = useState(false);

  const generateTemplate = () => {
    const csvContent = "nombre,slug,categoria_slug,marca_slug,precio_retail,precio_mayorista,precio_distribuidor,precio_comparativo,sku,stock,unidad,descripcion,etiquetas,activo,destacado,tonos\nEjemplo Producto,ejemplo-producto,maquillaje-rostro,marca-ejemplo,50000,35000,30000,60000,SKU-001,100,unidad,Descripción del producto,Nuevo|Oferta,TRUE,FALSE,Tono 1|Tono 2";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'carlin_productos_plantilla.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const res = await fetch('/api/admin/productos/import', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        setPreview(data);
      } catch (error) {
        console.error('Error importing CSV:', error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleConfirm = async () => {
    if (!preview || preview.valid.length === 0) return;
    setUploading(true);
    try {
      const res = await fetch('/api/admin/productos/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: preview.valid }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Éxito. Creados: ${data.created}, Actualizados: ${data.updated}`);
        setOpen(false);
        setPreview(null);
        setFile(null);
        window.location.reload();
      } else {
        alert(data.error || 'Error al importar');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button variant="outline" className="gap-2 text-xs sm:text-sm h-10 w-full sm:w-auto" onClick={() => setOpen(true)}>
        <Import size={16} /> Importar CSV
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h2 className="text-base sm:text-lg font-bold font-serif text-gray-900">Importación Masiva de Productos</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b shrink-0">
              <button 
                className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeTab === 'download' ? 'border-brand-pink text-brand-pink font-bold' : 'border-transparent text-gray-500'}`}
                onClick={() => setActiveTab('download')}
              >
                1. Descargar Plantilla
              </button>
              <button 
                className={`flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${activeTab === 'upload' ? 'border-brand-pink text-brand-pink font-bold' : 'border-transparent text-gray-500'}`}
                onClick={() => setActiveTab('upload')}
              >
                2. Subir CSV
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {activeTab === 'download' ? (
                <div className="text-center space-y-4 py-4 sm:py-8">
                  <Download className="mx-auto w-10 h-10 sm:w-12 sm:h-12 text-gray-300" />
                  <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                    Descarga la plantilla oficial en formato CSV. Asegúrate de llenar todas las columnas obligatorias sin cambiar los nombres de las cabeceras.
                  </p>
                  <Button onClick={generateTemplate} className="bg-brand-pink hover:bg-brand-pink-dark text-white text-xs sm:text-sm h-10">
                    Descargar Plantilla CSV
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {!preview ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 sm:p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        id="csv-upload"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-brand-pink" />
                        <span className="font-semibold text-xs sm:text-sm text-gray-700">
                          {uploading ? 'Procesando archivo...' : 'Selecciona o arrastra el archivo CSV'}
                        </span>
                        <span className="text-xs text-gray-500">Solo archivos .csv válidos</span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-gray-50 p-3 sm:p-4 rounded-xl">
                        <div className="text-xs sm:text-sm">
                          <span className="font-bold text-green-600">{preview.valid.length} válidos</span> | 
                          <span className="font-bold text-red-600 ml-2">{preview.errors.length} errores</span>
                        </div>
                        <Button 
                          onClick={handleConfirm} 
                          disabled={preview.valid.length === 0 || uploading}
                          className="bg-brand-pink hover:bg-brand-pink-dark text-white text-xs sm:text-sm h-9 w-full sm:w-auto"
                        >
                          {uploading ? 'Importando...' : 'Confirmar e Importar'}
                        </Button>
                      </div>

                      {preview.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 sm:p-4">
                          <h3 className="text-red-800 font-semibold text-xs sm:text-sm flex items-center gap-2 mb-2">
                            <AlertCircle size={15} /> Errores encontrados
                          </h3>
                          <ul className="text-xs text-red-600 space-y-1 list-disc pl-5 max-h-36 overflow-y-auto">
                            {preview.errors.map((err, idx) => (
                              <li key={idx}>Fila {err.row}: {err.field} - {err.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {preview.valid.length > 0 && (
                        <div className="border rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50 font-semibold sticky top-0">
                              <tr>
                                <th className="p-2 border-b">Nombre</th>
                                <th className="p-2 border-b">Categoría</th>
                                <th className="p-2 border-b">P. Retail</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {preview.valid.map((p, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                  <td className="p-2 truncate max-w-[150px]">{p.name}</td>
                                  <td className="p-2 truncate max-w-[100px]">{p.categoria_slug}</td>
                                  <td className="p-2 font-bold">${p.retailPrice}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
