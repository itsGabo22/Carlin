import React from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { prisma } from '@/lib/prisma';

export const metadata = {
  title: 'Carlin Admin Panel',
  description: 'Gestión de tienda Carlin Cosméticos',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingOrdersCount = await prisma.order.count({
    where: { status: 'PENDING_WHATSAPP' }
  });

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      <AdminSidebar pendingOrdersCount={pendingOrdersCount} />
      <main className="flex-1 overflow-y-auto flex flex-col">
        <AdminTopBar />
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
