import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Package, Tags, Users, ClipboardList, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDashboardPage() {
  const [
    totalProducts,
    totalBrands,
    pendingWholesalers,
    pendingOrders,
    categoryCount
  ] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.brand.count(),
    prisma.wholesaleUser.count({ where: { approved: false } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.category.count()
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-nunito text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen general de tu tienda Carlin Cosméticos.</p>
      </div>

      {totalProducts === 0 && (
        <div className="bg-white border border-brand-pink/20 rounded-2xl p-5 mb-6">
          <p className="font-semibold text-brand-neutral-dark mb-3">
            🚀 Guía de inicio rápido
          </p>
          <div className="space-y-3">
            {[
              { step: 1, done: totalBrands > 0,   text: 'Crea las marcas de tus productos',        href: '/admin/marcas' },
              { step: 2, done: categoryCount > 0, text: 'Crea las categorías del catálogo',        href: '/admin/categorias' },
              { step: 3, done: false,             text: 'Sube las fotos en la bandeja de imágenes', href: '/admin/imagenes' },
              { step: 4, done: totalProducts > 0,  text: 'Agrega tus productos',                    href: '/admin/productos/nuevo' },
              { step: 5, done: false,             text: 'Personaliza el inicio de la web',          href: '/admin/configuracion' },
            ].map(({ step, done, text, href }) => (
              <Link key={step} href={href}
                className="flex items-center gap-3 group">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${done ? 'bg-green-100 text-green-600' : 'bg-brand-pink-light text-brand-pink-dark'}`}>
                  {done ? '✓' : step}
                </span>
                <span className={`text-sm transition-colors group-hover:text-brand-pink-dark ${done ? 'line-through text-neutral-400' : 'text-neutral-700'}`}>
                  {text}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Productos Activos</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalProducts}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Tags size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Marcas Registradas</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalBrands}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center relative bg-orange-100 text-orange-600">
              <Users size={24} />
              {pendingWholesalers > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Mayoristas Pendientes</p>
              <h3 className="text-2xl font-bold text-gray-900">{pendingWholesalers}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <ClipboardList size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pedidos Nuevos</p>
              <h3 className="text-2xl font-bold text-gray-900">{pendingOrders}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold border-b pb-2">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link href="/admin/productos/nuevo" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-brand-pink/5 hover:border-brand-pink/30 transition-colors gap-2 text-center group bg-white">
            <div className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink group-hover:scale-110 transition-transform">
              <Package size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-brand-pink-dark">Agregar producto</span>
          </Link>
          
          <Link href="/admin/productos" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-brand-pink/5 hover:border-brand-pink/30 transition-colors gap-2 text-center group bg-white">
            <div className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-brand-pink-dark">Importar CSV</span>
          </Link>

          <Link href="/admin/imagenes" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-brand-pink/5 hover:border-brand-pink/30 transition-colors gap-2 text-center group bg-white">
            <div className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink group-hover:scale-110 transition-transform">
              <Tags size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-brand-pink-dark">Bandeja imágenes</span>
          </Link>

          <Link href="/admin/mayoristas" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-brand-pink/5 hover:border-brand-pink/30 transition-colors gap-2 text-center group bg-white">
            <div className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink group-hover:scale-110 transition-transform relative">
              <Users size={20} />
              {pendingWholesalers > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>}
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-brand-pink-dark">Aprobar mayoristas</span>
          </Link>

          <a href="/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-brand-pink/5 hover:border-brand-pink/30 transition-colors gap-2 text-center group bg-white">
            <div className="w-10 h-10 rounded-full bg-brand-pink/10 flex items-center justify-center text-brand-pink group-hover:scale-110 transition-transform">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-brand-pink-dark">Ver tienda pública</span>
          </a>
        </div>
      </div>
    </div>
  );
}
