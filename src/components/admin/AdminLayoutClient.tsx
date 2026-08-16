'use client';

import React, { useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

interface AdminLayoutClientProps {
  pendingOrdersCount: number;
  children: React.ReactNode;
}

export function AdminLayoutClient({ pendingOrdersCount, children }: AdminLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <AdminSidebar
        pendingOrdersCount={pendingOrdersCount}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        <AdminTopBar onMenuClick={() => setMobileOpen(true)} />
        <div className="flex-1 p-3 sm:p-4 md:p-6 min-w-0">
          {children}
        </div>
      </main>
    </div>
  );
}
