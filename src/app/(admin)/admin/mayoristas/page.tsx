import { prisma } from '@/lib/prisma';
import { Users } from 'lucide-react';
import MayoristasClient from './MayoristasClient';

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

      <MayoristasClient initialUsers={users} />
    </div>
  );
}
