'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Gift, Mail, Phone, Building2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

type WholesaleUser = any;

function isUserActive(user: WholesaleUser, inactivityDays: number): boolean {
  if (!user.approved) return false;
  const baseDate = user.lastOrderAt ?? user.approvedAt ?? user.createdAt;
  if (!baseDate) return false;
  const limit = new Date();
  limit.setDate(limit.getDate() - inactivityDays);
  return new Date(baseDate) >= limit;
}

export default function MayoristasClient({
  initialUsers,
  inactivityDays,
}: {
  initialUsers: WholesaleUser[];
  inactivityDays: number;
}) {
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
    return users.filter(u => {
      if (tab === 'ALL') return true;
      if (tab === 'PENDING') return !u.approved;

      const isActive = isUserActive(u, inactivityDays);
      if (tab === 'INACTIVE') return u.approved && !isActive;
      if (tab === 'MAYORISTA') return isActive && u.role === 'MAYORISTA';
      if (tab === 'DISTRIBUIDOR') return isActive && u.role === 'DISTRIBUIDOR';

      return false;
    });
  };

  const filteredUsers = getFilteredUsers();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Scrollable Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-gray-200 bg-gray-50 p-2 sm:p-3 gap-2 flex-nowrap">
        <Button
          variant={tab === 'PENDING' ? 'primary' : 'ghost'}
          onClick={() => setTab('PENDING')}
          className={`shrink-0 text-xs sm:text-sm h-9 px-3 ${tab === 'PENDING' ? 'bg-brand-pink hover:bg-brand-pink-dark text-white' : 'text-gray-600'}`}
        >
          Pendientes ({users.filter(u => !u.approved).length})
        </Button>
        <Button
          variant={tab === 'MAYORISTA' ? 'primary' : 'ghost'}
          onClick={() => setTab('MAYORISTA')}
          className={`shrink-0 text-xs sm:text-sm h-9 px-3 ${tab === 'MAYORISTA' ? 'bg-brand-pink hover:bg-brand-pink-dark text-white' : 'text-gray-600'}`}
        >
          Mayoristas Activos
        </Button>
        <Button
          variant={tab === 'DISTRIBUIDOR' ? 'primary' : 'ghost'}
          onClick={() => setTab('DISTRIBUIDOR')}
          className={`shrink-0 text-xs sm:text-sm h-9 px-3 ${tab === 'DISTRIBUIDOR' ? 'bg-brand-pink hover:bg-brand-pink-dark text-white' : 'text-gray-600'}`}
        >
          Distribuidores Activos
        </Button>
        <Button
          variant={tab === 'INACTIVE' ? 'primary' : 'ghost'}
          onClick={() => setTab('INACTIVE')}
          className={`shrink-0 text-xs sm:text-sm h-9 px-3 ${tab === 'INACTIVE' ? 'bg-brand-pink hover:bg-brand-pink-dark text-white' : 'text-gray-600'}`}
        >
          Inactivos
        </Button>
        <Button
          variant={tab === 'ALL' ? 'primary' : 'ghost'}
          onClick={() => setTab('ALL')}
          className={`shrink-0 text-xs sm:text-sm h-9 px-3 ${tab === 'ALL' ? 'bg-brand-pink hover:bg-brand-pink-dark text-white' : 'text-gray-600'}`}
        >
          Todos ({users.length})
        </Button>
      </div>

      {/* Mobile Card List (visible < md) */}
      <div className="block md:hidden p-3 space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No se encontraron usuarios en esta sección.
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isPending = !user.approved;
            const isActive = isUserActive(user, inactivityDays);

            return (
              <div key={user.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-xs">
                {/* Header: Name + Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-snug">
                      {user.name || 'Sin nombre'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                      <Building2 size={13} className="text-gray-400 shrink-0" />
                      <span>{user.businessName || 'Sin negocio'}</span>
                      {user.taxId && <span>• NIT: {user.taxId}</span>}
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    user.role === 'DISTRIBUIDOR' ? 'bg-brand-distributor/10 text-brand-distributor-dark' : 'bg-brand-wholesale/10 text-brand-wholesale-dark'
                  }`}>
                    {user.role}
                  </span>
                </div>

                {/* Contact & Location info */}
                <div className="space-y-1 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <Mail size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-gray-400 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.city && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-gray-400 shrink-0" />
                      <span>{user.city}</span>
                    </div>
                  )}
                </div>

                {/* Status + Purchase + Welcome details */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Última compra:</span>
                    <span className="font-semibold text-gray-800">
                      {user.lastOrderAt ? new Date(user.lastOrderAt).toLocaleDateString() : 'Sin compras'}
                    </span>
                  </div>

                  {isPending ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                      Pendiente
                    </span>
                  ) : isActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <CheckCircle2 size={11} /> ACTIVO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                      <XCircle size={11} /> INACTIVO
                    </span>
                  )}
                </div>

                {user.role === 'MAYORISTA' && !isPending && (
                  <div className="text-[11px]">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${
                      user.welcomeDiscountUsedAt ? 'bg-gray-100 text-gray-500' : 'bg-brand-pink/15 text-brand-pink-dark'
                    }`}>
                      <Gift size={11} />
                      {user.welcomeDiscountUsedAt ? 'Bienvenida usada' : 'Bienvenida disponible'}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-gray-100">
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white h-9 text-xs font-bold"
                        onClick={() => handleAction(user.id, 'approve')}
                        disabled={loadingAction === user.id}
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1 h-9 text-xs font-bold"
                        onClick={() => handleAction(user.id, 'reject')}
                        disabled={loadingAction === user.id}
                      >
                        Rechazar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs text-gray-500">Rol:</span>
                        <select
                          className="text-xs border border-gray-200 rounded-lg p-1.5 bg-white font-medium flex-1"
                          value={user.role}
                          onChange={(e) => handleAction(user.id, 'change_role', e.target.value)}
                          disabled={loadingAction === user.id}
                        >
                          <option value="MAYORISTA">Mayorista</option>
                          <option value="DISTRIBUIDOR">Distribuidor</option>
                        </select>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 border-orange-200 hover:bg-orange-50 h-8 text-xs font-medium"
                        onClick={() => handleAction(user.id, 'revoke')}
                        disabled={loadingAction === user.id}
                      >
                        Revocar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (visible >= md) */}
      <div className="hidden md:block overflow-x-auto">
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
              const isActive = isUserActive(user, inactivityDays);

              return (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{user.businessName || 'N/A'}</div>
                    <div className="text-xs text-gray-400">NIT: {user.taxId || 'N/A'}</div>
                    {user.city && <div className="text-xs text-gray-400">{user.city}</div>}
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
                    <div className="flex flex-col gap-1">
                      <span className={user.lastOrderAt ? 'text-gray-600' : 'text-xs text-gray-400 font-medium'}>
                        {user.lastOrderAt ? new Date(user.lastOrderAt).toLocaleDateString() : 'Sin compras'}
                      </span>
                      {!isPending && (
                        isActive ? (
                          <span className="text-[10px] font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={12} /> ACTIVO</span>
                        ) : (
                          <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><XCircle size={12} /> INACTIVO</span>
                        )
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isPending ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Pendiente</span>
                    ) : (
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Aprobado</span>
                        {user.role === 'MAYORISTA' && (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${user.welcomeDiscountUsedAt
                              ? 'bg-gray-100 text-gray-500'
                              : 'bg-brand-pink/15 text-brand-pink-dark'
                              }`}
                            title={user.welcomeDiscountUsedAt
                              ? `Descuento de bienvenida usado el ${new Date(user.welcomeDiscountUsedAt).toLocaleDateString()}`
                              : 'Aún no ha usado su descuento de bienvenida'}
                          >
                            <Gift size={10} />
                            {user.welcomeDiscountUsedAt ? 'Bienvenida usada' : 'Bienvenida disponible'}
                          </span>
                        )}
                      </div>
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
