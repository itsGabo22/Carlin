'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, User } from 'lucide-react';
import Link from 'next/link';

type Notification = {
  id: string;
  type: 'order' | 'wholesaler';
  message: string;
  href: string;
  count: number;
};

export function AdminTopBar() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/admin/notificaciones');
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Revalidate every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10">
      <div className="flex items-center text-sm text-gray-500 font-medium">
        Gestión de Tienda
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
          >
            <Bell size={20} />
            {total > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-brand-pink text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {total > 9 ? '9+' : total}
              </span>
            )}
          </button>
          
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-brand-pink/10 border border-brand-pink/10 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-brand-pink/10 flex justify-between items-center">
                <p className="font-semibold text-sm text-brand-neutral-dark">
                  Notificaciones
                </p>
                {total > 0 && (
                  <span className="text-xs bg-brand-pink/10 text-brand-pink px-2 py-0.5 rounded-full font-medium">
                    {total}
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-sm text-neutral-400 text-center">
                  Sin notificaciones pendientes ✓
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(n => (
                    <Link key={n.id} href={n.href}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-brand-pink-light transition-colors border-b border-brand-pink/5 last:border-0">
                      <span className="mt-0.5 text-lg">
                        {n.type === 'order' ? '📋' : '👥'}
                      </span>
                      <div>
                        <p className="text-sm text-brand-neutral-dark">{n.message}</p>
                        <p className="text-xs text-brand-pink mt-0.5 font-medium">Ver →</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
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
