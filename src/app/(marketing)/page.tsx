import { HeroSection } from '@/components/marketing/HeroSection';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carlin Cosméticos | Catálogo Mayorista de Belleza',
  description: 'Descubre el catálogo más completo de maquillaje, cuidado facial y accesorios. Únete a nuestra red de mayoristas.',
};

export default async function HomePage() {
  const config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } });

  return (
    <main>
      <HeroSection config={config} />
      
      {/* Rest of the homepage content like featured categories/products would go here */}
      <section className="py-24 bg-brand-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-serif text-3xl font-bold text-brand-text mb-4">Descubre Nuestras Categorías</h2>
          <p className="text-gray-600 font-sans">Explora nuestro catálogo para encontrar lo mejor en belleza y cuidado.</p>
        </div>
      </section>
    </main>
  );
}
