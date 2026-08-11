'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Botón de borrado de la lista de productos.
 *
 * La página /admin/productos es un Server Component, así que el botón vive
 * aparte como client component en vez de convertir toda la página.
 *
 * OJO: el endpoint DELETE hace borrado LÓGICO (active: false), no borra la
 * fila. Como la lista muestra también los inactivos, el producto no desaparece
 * de la tabla: pasa a mostrarse como "Inactivo". El texto de confirmación lo
 * dice explícitamente para que no parezca que el botón no hizo nada.
 *
 * Mismo patrón de confirmación que marcas y categorías (confirm nativo →
 * fetch DELETE → refrescar → mensaje de error si falla).
 */
export function DeleteProductButton({
  productId,
  productName,
  isActive,
}: {
  productId: string;
  productName: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;

    const ok = confirm(
      `¿Desactivar "${productName}"?\n\n` +
        'El producto deja de verse en la tienda y queda como "Inactivo" en esta ' +
        'lista. No se borra: puedes volver a activarlo editándolo.'
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/productos/${productId}`, { method: 'DELETE' });

      if (res.ok) {
        // La página es force-dynamic: refresh vuelve a consultar el servidor
        // sin recargar toda la ventana ni perder la posición del scroll.
        router.refresh();
        return;
      }

      const text = await res.text().catch(() => '');
      let mensaje = `No se pudo desactivar el producto (error ${res.status}).`;
      try {
        const data = text ? JSON.parse(text) : null;
        if (data?.error) mensaje = data.error;
      } catch {
        /* respuesta sin JSON: se queda el mensaje genérico */
      }
      alert(mensaje);
      setDeleting(false);
    } catch {
      alert('Error de conexión al desactivar el producto.');
      setDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
      onClick={handleDelete}
      disabled={deleting || !isActive}
      title={
        !isActive
          ? 'El producto ya está inactivo'
          : `Desactivar "${productName}" (no se borra)`
      }
      aria-label={`Desactivar ${productName}`}
    >
      {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
    </Button>
  );
}
