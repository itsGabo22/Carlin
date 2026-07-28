import type { Metadata } from 'next';
import { Percent, PackageCheck, Truck } from 'lucide-react';
import { WholesaleBanner } from '@/components/marketing/WholesaleBanner';

export const metadata: Metadata = {
  title: 'Programa para Mayoristas',
  description: 'Precios especiales, sin mínimo por referencia y envíos a toda Colombia para mayoristas y distribuidores Carlin Cosméticos.',
};

const BENEFITS = [
  {
    icon: Percent,
    title: 'Precios preferenciales',
    description: 'Accede a tarifas exclusivas para mayoristas y distribuidores en todo el catálogo.',
  },
  {
    icon: PackageCheck,
    title: 'Sin mínimo por referencia',
    description: 'Arma tu pedido combinando las referencias que quieras, sin cantidades mínimas por producto.',
  },
  {
    icon: Truck,
    title: 'Envíos a toda Colombia',
    description: 'Despachamos a todo el país para que puedas atender a tus clientes sin demoras.',
  },
];

export default function MayoristasInfoPage() {
  return (
    <main>
      <section className="max-w-5xl mx-auto px-4 pt-16 pb-8 text-center">
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-brand-pink-dark mb-4">
          Programa para Mayoristas
        </h1>
        <p className="font-sans text-gray-600 text-lg max-w-2xl mx-auto">
          Únete a la red de mayoristas y distribuidores de Carlin Cosméticos y accede a precios especiales en maquillaje, cuidado facial y capilar.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {BENEFITS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col items-center text-center bg-white rounded-2xl p-6 border border-brand-pink-light/20 shadow-sm"
          >
            <div className="w-14 h-14 rounded-full bg-brand-pink-light/40 flex items-center justify-center mb-4">
              <Icon className="w-6 h-6 text-brand-pink-dark" />
            </div>
            <h2 className="font-nunito font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        ))}
      </section>

      <WholesaleBanner />
    </main>
  );
}
