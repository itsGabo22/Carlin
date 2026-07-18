'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Import, Download, UploadCloud, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

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
      <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
        <Import size={16} /> Importar CSV
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold font-nunito">Importación Masiva de Productos</h2>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-800 text-xl font-bold">&times;</button>
            </div>

            <div className="flex border-b">
              <button 
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'download' ? 'border-brand-pink text-brand-pink' : 'border-transparent text-gray-500'}`}
                onClick={() => setActiveTab('download')}
              >
                1. Descargar Plantilla
              </button>
              <button 
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'upload' ? 'border-brand-pink text-brand-pink' : 'border-transparent text-gray-500'}`}
                onClick={() => setActiveTab('upload')}
              >
                2. Subir CSV
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === 'download' ? (
                <div className="text-center space-y-4 py-8">
                  <Download className="mx-auto w-12 h-12 text-gray-300" />
                  <p className="text-gray-600 max-w-md mx-auto">
                    Descarga la plantilla oficial en formato CSV. Asegúrate de llenar todas las columnas obligatorias sin cambiar los nombres de las cabeceras.
                  </p>
                  <Button onClick={generateTemplate} className="bg-brand-pink hover:bg-brand-pink-dark">
                    Descargar Plantilla CSV
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {!preview ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        id="csv-upload"
                        onChange={handleFileChange}
                        disabled={uploading}
                      />
                      <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        <UploadCloud className="w-12 h-12 text-brand-pink" />
                        <span className="font-medium text-gray-700">
                          {uploading ? 'Procesando archivo...' : 'Selecciona o arrastra el archivo CSV'}
                        </span>
                        <span className="text-sm text-gray-500">Solo archivos .csv validos</span>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm">
                          <span className="font-bold text-green-600">{preview.valid.length} válidos</span> | 
                          <span className="font-bold text-red-600 ml-2">{preview.errors.length} errores</span>
                        </div>
                        <Button 
                          onClick={handleConfirm} 
                          disabled={preview.valid.length === 0 || uploading}
                          className="bg-brand-pink hover:bg-brand-pink-dark"
                        >
                          {uploading ? 'Importando...' : 'Confirmar e Importar'}
                        </Button>
                      </div>

                      {preview.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                          <h3 className="text-red-800 font-medium flex items-center gap-2 mb-2">
                            <AlertCircle size={16} /> Errores encontrados
                          </h3>
                          <ul className="text-sm text-red-600 space-y-1 list-disc pl-5 max-h-40 overflow-y-auto">
                            {preview.errors.map((err, idx) => (
                              <li key={idx}>Fila {err.row}: {err.field} - {err.message}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {preview.valid.length > 0 && (
                        <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 font-medium sticky top-0">
                              <tr>
                                <th className="p-2 border-b">Nombre</th>
                                <th className="p-2 border-b">Categoría</th>
                                <th className="p-2 border-b">P. Retail</th>
                              </tr>
                            </thead>
                            <tbody>
                              {preview.valid.map((p, idx) => (
                                <tr key={idx} className="border-b last:border-0">
                                  <td className="p-2">{p.name}</td>
                                  <td className="p-2">{p.categoria_slug}</td>
                                  <td className="p-2">${p.retailPrice}</td>
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
