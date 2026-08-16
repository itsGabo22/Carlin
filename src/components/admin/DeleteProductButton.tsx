'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
  isActive: boolean;
}

export function DeleteProductButton({
  productId,
  productName,
  isActive,
}: DeleteProductButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (loading) return;

    if (isActive) {
      // Soft-delete confirmation (Deactivate)
      const ok = confirm(
        `¿Desactivar "${productName}"?\n\n` +
        'El producto dejará de verse en la tienda y quedará como "Inactivo" en esta lista.\n' +
        'No se borra permanentemente: puedes volver a activarlo en cualquier momento haciendo clic en "Inactivo" o editándolo.'
      );
      if (!ok) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/admin/productos/${productId}`, { method: 'DELETE' });
        if (res.ok) {
          router.refresh();
          return;
        }
        const data = await res.json().catch(() => null);
        alert(data?.error ?? `No se pudo desactivar el producto (error ${res.status}).`);
      } catch {
        alert('Error de conexión al desactivar el producto.');
      } finally {
        setLoading(false);
      }
    } else {
      // Hard-delete confirmation (Permanent)
      const ok = confirm(
        `⚠️ ¿ELIMINAR PERMANENTEMENTE "${productName}"?\n\n` +
        'Esta acción NO se puede deshacer. El producto, sus variantes y configuraciones se borrarán definitivamente de la base de datos.\n\n' +
        '¿Deseas continuar?'
      );
      if (!ok) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/admin/productos/${productId}?hard=true`, { method: 'DELETE' });
        if (res.ok) {
          router.refresh();
          return;
        }
        const data = await res.json().catch(() => null);
        alert(data?.error ?? `No se pudo eliminar el producto (error ${res.status}).`);
      } catch {
        alert('Error de conexión al eliminar permanentemente el producto.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (isActive) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        disabled={loading}
        title={`Desactivar "${productName}" (no se borra)`}
        aria-label={`Desactivar ${productName}`}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-red-700 hover:text-red-900 hover:bg-red-100 bg-red-50/70"
      onClick={handleDelete}
      disabled={loading}
      title={`Eliminar permanentemente "${productName}" (irreversible)`}
      aria-label={`Eliminar permanentemente ${productName}`}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} className="stroke-[2.2]" />}
    </Button>
  );
}
