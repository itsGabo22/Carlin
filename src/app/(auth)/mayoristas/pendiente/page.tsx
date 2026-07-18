import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getSessionResult } from '@/lib/auth/carlin-session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cuenta Pendiente',
};

export default async function PendientePage() {
  const config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } });
  const safeConfig = config || { inactivityDays: 30 } as any;
  const sessionResult = await getSessionResult(safeConfig);

  // If they are not logged in at all, go to login
  if (!sessionResult.user && !sessionResult.isPending) {
    redirect('/mayoristas/login');
  }

  // If they are approved and active, they shouldn't be here
  if (sessionResult.isActive) {
    redirect('/catalogo');
  }

  return (
    <div className="max-w-md mx-auto py-24 px-4 text-center">
      <div className="bg-orange-100 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
        <Clock className="w-12 h-12 text-orange-500" />
      </div>
      <h1 className="text-3xl font-nunito font-bold text-gray-900 mb-4">Cuenta en Revisión</h1>
      <p className="text-gray-600 mb-8">
        Tu solicitud como mayorista está siendo revisada por nuestro equipo. Te notificaremos pronto cuando haya sido aprobada.
      </p>
      <Link href="/catalogo">
        <Button className="w-full bg-brand-pink hover:bg-brand-pink-dark text-white text-lg py-6">
          Explorar catálogo (Precio Detal)
        </Button>
      </Link>
    </div>
  );
}
