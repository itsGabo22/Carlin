'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Image as ImageIcon,
  Tags,
  FolderTree,
  Percent,
  ClipboardList,
  Users,
  Settings,
  ExternalLink,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/productos', label: 'Productos', icon: Package },
  { href: '/admin/imagenes', label: 'Imágenes', icon: ImageIcon },
  { href: '/admin/marcas', label: 'Marcas', icon: Tags },
  { href: '/admin/categorias', label: 'Categorías', icon: FolderTree },
  { href: '/admin/descuentos', label: 'Descuentos', icon: Percent },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/mayoristas', label: 'Mayoristas', icon: Users },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

export function AdminSidebar({ pendingOrdersCount = 0 }: { pendingOrdersCount?: number }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-[#3D1020] text-white flex flex-col transition-all duration-300 border-r border-white/10 shrink-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
        {!collapsed && <span className="font-pacifico text-xl text-brand-pink-light">Carlin Admin</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn("p-1 hover:bg-white/10 rounded-md transition-colors", collapsed && "mx-auto")}
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm relative",
                active 
                  ? "bg-brand-pink text-white" 
                  : "text-white/70 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? link.label : undefined}
            >
              <link.icon size={20} className="shrink-0" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span>{link.label}</span>
                  {link.href === '/admin/pedidos' && pendingOrdersCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {pendingOrdersCount}
                    </span>
                  )}
                </div>
              )}
              {collapsed && link.href === '/admin/pedidos' && pendingOrdersCount > 0 && (
                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-white/10 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm text-white/70 hover:bg-white/10 hover:text-white",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Ver tienda" : undefined}
        >
          <ExternalLink size={20} className="shrink-0" />
          {!collapsed && <span>Ver tienda</span>}
        </a>

        <form action="/api/admin/auth/logout" method="POST">
          <button
            type="submit"
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium text-sm text-red-400 hover:bg-red-400/10",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
