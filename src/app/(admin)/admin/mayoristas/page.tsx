import { prisma } from '@/lib/prisma';
import { Users } from 'lucide-react';
import MayoristasClient from './MayoristasClient';
import { FieldHint } from '@/components/admin/FieldHint';
import { getSiteConfig } from '@/lib/site-config';

export default async function AdminMayoristasPage() {
  const [users, config] = await Promise.all([
    prisma.wholesaleUser.findMany({ orderBy: { createdAt: 'desc' } }),
    getSiteConfig(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-serif text-gray-900 flex items-center gap-2">
            <Users className="text-brand-pink" /> Mayoristas
          </h1>
          <p className="text-gray-500">Gestiona las solicitudes y cuentas de clientes mayoristas.</p>
        </div>
      </div>

      <FieldHint type="tip" text={`Los mayoristas se registran desde la página web. Cuando apruebes uno, recibirá un correo automático y podrá ver los precios especiales al iniciar sesión. Una cuenta recién aprobada cuenta como activa aunque todavía no haya comprado. Si pasan más de ${config.inactivityDays} días sin comprar, sus precios especiales se pausan hasta que hagan una nueva compra.`} />

      <MayoristasClient initialUsers={users} inactivityDays={config.inactivityDays} />
    </div>
  );
}
