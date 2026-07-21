import React from 'react';

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold font-nunito mb-8 text-brand-pink-dark">Política de Privacidad</h1>
      <div className="prose prose-pink max-w-none text-gray-700 space-y-4">
        <p>En Carlin Cosméticos, valoramos y respetamos tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tu información personal.</p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6">Recopilación de Datos</h2>
        <p>Recopilamos información cuando te registras en nuestro sitio, realizas un pedido o te suscribes a nuestro boletín. Los datos recopilados incluyen tu nombre, dirección de correo electrónico, número de teléfono y detalles de la empresa (para mayoristas).</p>
        <h2 className="text-xl font-semibold text-gray-900 mt-6">Uso de la Información</h2>
        <p>Cualquier información que recopilemos de ti puede ser utilizada para personalizar tu experiencia, mejorar nuestro sitio web, mejorar el servicio al cliente y procesar transacciones de manera eficiente.</p>
      </div>
    </div>
  );
}
