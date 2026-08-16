import Link from 'next/link';
import { Sparkles, ArrowRight, Home, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Página no encontrada | CARLIN Cosméticos',
  description: 'La página que buscas no existe o ha sido movida.',
};

export default function NotFound() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-16 bg-gradient-to-b from-brand-pink-light/20 via-white to-brand-cream/30">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Decorative Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-pink-light/40 border border-brand-pink/20 text-brand-pink-dark text-xs font-bold uppercase tracking-wider">
          <Sparkles size={14} className="animate-pulse text-brand-pink" /> Error 404
        </div>

        {/* 404 Header */}
        <div className="space-y-2">
          <h1 className="text-6xl sm:text-7xl font-bold font-serif text-brand-neutral-dark tracking-tight">
            404
          </h1>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-800">
            Página no encontrada
          </h2>
          <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
            Lo sentimos, la página que buscas no existe, ha cambiado de dirección o no está disponible temporalmente.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/catalogo" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-brand-pink hover:bg-brand-pink-dark text-white font-bold h-11 px-6 rounded-xl shadow-sm gap-2 text-sm">
              <ShoppingBag size={18} /> Explorar Catálogo
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto border-brand-pink/30 text-brand-neutral-dark hover:bg-brand-pink-light/20 font-semibold h-11 px-6 rounded-xl gap-2 text-sm">
              <Home size={18} /> Volver al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
