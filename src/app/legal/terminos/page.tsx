import React from 'react';

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold font-nunito mb-8 text-brand-pink-dark">Términos y Condiciones</h1>
      <div className="prose prose-pink max-w-none text-gray-700 space-y-4">
        <p>Bienvenido a Carlin Cosméticos. Al acceder y utilizar este sitio web, aceptas cumplir con los siguientes términos y condiciones de uso.</p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6">Compras Mayoristas</h2>
        <p>Para acceder a los precios especiales, debes estar registrado y aprobado como Mayorista o Distribuidor. Existen montos mínimos de compra para cada categoría que deben ser respetados en cada pedido.</p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6">Inactividad</h2>
        <p>Si una cuenta de mayorista permanece inactiva (sin realizar compras) por el tiempo estipulado en nuestras políticas comerciales, la cuenta podría perder sus beneficios y ser relegada a cliente regular, requiriendo cumplir nuevamente el monto mínimo para reactivarse.</p>
      </div>
    </div>
  );
}
