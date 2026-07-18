import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Package, Plus, Search, Edit, Trash2, Import } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default async function AdminProductosPage() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      brand: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-nunito text-gray-900 flex items-center gap-2">
            <Package className="text-brand-pink" /> Productos
          </h1>
          <p className="text-gray-500">Administra el catálogo y los precios.</p>
        </div>
        <div className="flex gap-2">
          {/* CsvImportModal will be integrated here */}
          <Button variant="outline" className="gap-2">
            <Import size={16} /> Importar CSV
          </Button>
          <Link href="/admin/productos/nuevo">
            <Button className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2">
              <Plus size={16} /> Nuevo producto
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              type="text" 
              placeholder="Buscar por nombre o SKU..." 
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Imagen</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría / Marca</th>
                <th className="px-4 py-3">Público</th>
                <th className="px-4 py-3">Mayorista</th>
                <th className="px-4 py-3">Distribuidor</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-12 h-12 rounded-md bg-gray-100 border border-gray-200 overflow-hidden">
                      {product.imageUrls[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {product.name}
                    {product.sku && <div className="text-xs text-gray-500 font-normal">SKU: {product.sku}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{product.category.name}</div>
                    {product.brand && <div className="text-xs text-gray-400">{product.brand.name}</div>}
                  </td>
                  <td className="px-4 py-3">${Number(product.retailPrice).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-brand-wholesale-dark">${Number(product.wholesalePrice).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-brand-distributor-dark">${Number(product.distributorPrice).toLocaleString()}</td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3">
                    {product.active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Activo</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Inactivo</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/productos/${product.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Edit size={16} />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
