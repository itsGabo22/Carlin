'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WholesaleUser = any; // simplified for this component

export default function MayoristasClient({ initialUsers }: { initialUsers: WholesaleUser[] }) {
  const [users, setUsers] = useState<WholesaleUser[]>(initialUsers);
  const [tab, setTab] = useState<'PENDING' | 'MAYORISTA' | 'DISTRIBUIDOR' | 'INACTIVE' | 'ALL'>('PENDING');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleAction = async (id: string, action: string, role?: string) => {
    if (!confirm(`¿Estás seguro de realizar esta acción?`)) return;

    setLoadingAction(id);
    try {
      const res = await fetch(`/api/admin/mayoristas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, role })
      });

      if (res.ok) {
        if (action === 'reject') {
          setUsers(users.filter(u => u.id !== id));
        } else {
          const updatedUser = await res.json();
          setUsers(users.map(u => u.id === id ? updatedUser : u));
        }
        alert('Acción completada exitosamente');
      } else {
        alert('Error al realizar la acción');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setLoadingAction(null);
    }
  };

  const getFilteredUsers = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return users.filter(u => {
      if (tab === 'ALL') return true;
      if (tab === 'PENDING') return !u.approved;
      if (tab === 'INACTIVE') return u.approved && (!u.lastOrderAt || new Date(u.lastOrderAt) < thirtyDaysAgo);

      const isActive = u.approved && u.lastOrderAt && new Date(u.lastOrderAt) >= thirtyDaysAgo;
      if (tab === 'MAYORISTA') return isActive && u.role === 'MAYORISTA';
      if (tab === 'DISTRIBUIDOR') return isActive && u.role === 'DISTRIBUIDOR';

      return false;
    });
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 p-2 gap-2">
        <Button
          variant={tab === 'PENDING' ? 'primary' : 'ghost'}
          onClick={() => setTab('PENDING')}
          className={tab === 'PENDING' ? 'bg-brand-pink hover:bg-brand-pink-dark' : 'text-gray-600'}
        >
          Pendientes ({users.filter(u => !u.approved).length})
        </Button>
        <Button
          variant={tab === 'MAYORISTA' ? 'primary' : 'ghost'}
          onClick={() => setTab('MAYORISTA')}
          className={tab === 'MAYORISTA' ? 'bg-brand-pink hover:bg-brand-pink-dark' : 'text-gray-600'}
        >
          Mayoristas Activos
        </Button>
        <Button
          variant={tab === 'DISTRIBUIDOR' ? 'primary' : 'ghost'}
          onClick={() => setTab('DISTRIBUIDOR')}
          className={tab === 'DISTRIBUIDOR' ? 'bg-brand-pink hover:bg-brand-pink-dark' : 'text-gray-600'}
        >
          Distribuidores Activos
        </Button>
        <Button
          variant={tab === 'INACTIVE' ? 'primary' : 'ghost'}
          onClick={() => setTab('INACTIVE')}
          className={tab === 'INACTIVE' ? 'bg-brand-pink hover:bg-brand-pink-dark' : 'text-gray-600'}
        >
          Inactivos
        </Button>
        <Button
          variant={tab === 'ALL' ? 'primary' : 'ghost'}
          onClick={() => setTab('ALL')}
          className={tab === 'ALL' ? 'bg-brand-pink hover:bg-brand-pink-dark' : 'text-gray-600'}
        >
          Todos
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Negocio / NIT</th>
              <th className="px-4 py-3">Email / Teléfono</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Última Compra</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => {
              const isPending = !user.approved;
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              const isActive = user.lastOrderAt && new Date(user.lastOrderAt) >= thirtyDaysAgo;

              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{user.businessName || 'N/A'}</div>
                    <div className="text-xs text-gray-400">NIT: {user.taxId || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{user.email}</div>
                    <div className="text-xs text-gray-400">{user.phone || 'N/A'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'DISTRIBUIDOR' ? 'bg-brand-distributor/10 text-brand-distributor-dark' : 'bg-brand-wholesale/10 text-brand-wholesale-dark'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {user.lastOrderAt ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-gray-600">{new Date(user.lastOrderAt).toLocaleDateString()}</span>
                        {isActive ? (
                          <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> ACTIVO</span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><XCircle size={12} /> INACTIVO</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Sin compras</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isPending ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Pendiente</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aprobado</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      {isPending ? (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => handleAction(user.id, 'approve')}
                            disabled={loadingAction === user.id}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(user.id, 'reject')}
                            disabled={loadingAction === user.id}
                          >
                            Rechazar
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          <select
                            className="text-xs border border-gray-200 rounded p-1"
                            value={user.role}
                            onChange={(e) => handleAction(user.id, 'change_role', e.target.value)}
                            disabled={loadingAction === user.id}
                          >
                            <option value="MAYORISTA">Mayorista</option>
                            <option value="DISTRIBUIDOR">Distribuidor</option>
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-orange-600 border-orange-200 hover:bg-orange-50 h-7 text-xs"
                            onClick={() => handleAction(user.id, 'revoke')}
                            disabled={loadingAction === user.id}
                          >
                            Revocar Acceso
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No se encontraron usuarios en esta sección.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
