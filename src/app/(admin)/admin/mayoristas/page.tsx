import { prisma } from '@/lib/prisma';
import { Users } from 'lucide-react';
import MayoristasClient from './MayoristasClient';
import { FieldHint } from '@/components/admin/FieldHint';

export default async function AdminMayoristasPage() {
  const users = await prisma.wholesaleUser.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-nunito text-gray-900 flex items-center gap-2">
            <Users className="text-brand-pink" /> Mayoristas
          </h1>
          <p className="text-gray-500">Gestiona las solicitudes y cuentas de clientes mayoristas.</p>
        </div>
      </div>

      <FieldHint type="tip" text="Los mayoristas se registran desde la página web. Cuando apruebes uno, recibirá un correo automático y podrá ver los precios especiales al iniciar sesión. Si llevan más de 30 días sin comprar, sus precios especiales se pausan hasta que hagan una nueva compra." />

      <MayoristasClient initialUsers={users} />
    </div>
  );
}
