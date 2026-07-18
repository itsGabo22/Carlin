import { prisma } from '@/lib/prisma';
import { FolderTree, Plus, Search, Edit, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default async function AdminCategoriasPage() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true, children: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  const rootCategories = categories.filter(c => !c.parentId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-nunito text-gray-900 flex items-center gap-2">
            <FolderTree className="text-brand-pink" /> Categorías
          </h1>
          <p className="text-gray-500">Organiza el catálogo en categorías y subcategorías.</p>
        </div>
        <Button className="bg-brand-pink hover:bg-brand-pink-dark text-white gap-2">
          <Plus size={16} /> Nueva categoría
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden p-6">
        <div className="text-sm bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 flex items-start gap-2 border border-blue-100">
          <div className="shrink-0 mt-0.5">ℹ️</div>
          <p>
            Las nuevas categorías aparecen automáticamente en el menú de navegación y en el catálogo. 
            Activa <span className="font-semibold">&quot;Agrupar por marca&quot; (groupByBrand)</span> para categorías como &quot;Capilar por marca&quot; donde los productos se organizarán visualmente según su marca dentro del catálogo.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 grid grid-cols-12 px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-600">
            <div className="col-span-6">Estructura</div>
            <div className="col-span-2">Slug</div>
            <div className="col-span-2 text-center">N° Productos</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>
          <div className="divide-y divide-gray-100">
            {rootCategories.map((category) => {
              const children = categories.filter(c => c.parentId === category.id);
              return (
                <div key={category.id} className="flex flex-col">
                  {/* Parent Row */}
                  <div className="grid grid-cols-12 items-center px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="col-span-6 flex items-center gap-2 font-medium text-gray-900">
                      {children.length > 0 ? (
                        <ChevronRight size={16} className="text-gray-400" />
                      ) : (
                        <div className="w-4" /> // spacing spacer
                      )}
                      {category.name}
                      {category.groupByBrand && (
                        <span className="text-[10px] bg-brand-pink/10 text-brand-pink-dark px-2 py-0.5 rounded-full font-bold ml-2">AGRUPA MARCAS</span>
                      )}
                    </div>
                    <div className="col-span-2 text-sm text-gray-500">{category.slug}</div>
                    <div className="col-span-2 text-center text-sm">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {category._count.products} prod
                      </span>
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" disabled={category._count.products > 0 || category._count.children > 0}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Children Rows */}
                  {children.map(child => (
                    <div key={child.id} className="grid grid-cols-12 items-center px-4 py-2 hover:bg-gray-50 transition-colors border-t border-gray-50 bg-gray-50/30">
                      <div className="col-span-6 flex items-center gap-2 text-gray-700 text-sm pl-10">
                        └ {child.name}
                        {child.groupByBrand && (
                          <span className="text-[10px] bg-brand-pink/10 text-brand-pink-dark px-2 py-0.5 rounded-full font-bold ml-2">AGRUPA MARCAS</span>
                        )}
                      </div>
                      <div className="col-span-2 text-sm text-gray-500">{child.slug}</div>
                      <div className="col-span-2 text-center text-sm">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {child._count.products} prod
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Edit size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50" disabled={child._count.products > 0}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {rootCategories.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No hay categorías registradas. Crea una para comenzar.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
