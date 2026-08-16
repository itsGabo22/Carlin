import React from 'react';
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient';
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
    <AdminLayoutClient pendingOrdersCount={pendingOrdersCount}>
      {children}
    </AdminLayoutClient>
  );
}
