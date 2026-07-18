'use client';

import { Bell, User } from 'lucide-react';

export function AdminTopBar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      <div className="flex items-center text-sm text-gray-500 font-medium">
        Gestión de Tienda
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
          <Bell size={20} />
          {/* Notification indicator placeholder */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-pink rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
          <div className="w-8 h-8 rounded-full bg-brand-pink-light/20 flex items-center justify-center text-brand-pink-dark">
            <User size={16} />
          </div>
          <span className="text-sm font-medium text-gray-700 hidden sm:block">Admin</span>
        </div>
      </div>
    </header>
  );
}
