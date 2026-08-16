'use client';

import * as React from 'react';
import Image from 'next/image';
import { formatCOP } from '@/lib/utils/carlin-pricing';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertCircle, Phone, User, Calendar, ShoppingBag } from 'lucide-react';

type OrderItem = {
  id: string;
  productId: string;
  name: string;
  priceSnapshot: number;
  quantity: number;
  imageUrl: string | null;
  product: { stock: number };
};

type Order = {
  id: string;
  status: string;
  priceLevel: string;
  total: number;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  items: OrderItem[];
};

export default function PedidosClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = React.useState(initialOrders);
  const [activeTab, setActiveTab] = React.useState('PENDING_WHATSAPP');
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [loadingAction, setLoadingAction] = React.useState<string | null>(null);

  const pendingCount = orders.filter(o => o.status === 'PENDING_WHATSAPP').length;

  const filteredOrders = activeTab === 'ALL' 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const handleAction = async (id: string, action: 'confirm' | 'reject') => {
    setLoadingAction(id);
    try {
      const res = await fetch(`/api/admin/pedidos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Error al procesar el pedido');
        return;
      }

      const updatedOrder = await res.json();
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: updatedOrder.status } : o));
      
    } catch (err: any) {
      alert('Error de conexión al procesar el pedido.');
    } finally {
      setLoadingAction(null);
    }
  };

  const renderBadge = (level: string) => {
    switch (level) {
      case 'WHOLESALE': return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-brand-pink text-white">Mayorista</span>;
      case 'DISTRIBUTOR': return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-brand-distributor text-white">Distribuidor</span>;
      default: return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800">Público</span>;
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'PENDING_WHATSAPP': return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border text-yellow-600 border-yellow-600 bg-yellow-50">Pendiente</span>;
      case 'CONFIRMED': return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border text-green-600 border-green-600 bg-green-50">Confirmado</span>;
      case 'REJECTED': return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border text-red-600 border-red-600 bg-red-50">Rechazado</span>;
      default: return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
      
      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 border-b border-gray-100 pb-3 overflow-x-auto no-scrollbar flex-nowrap">
        <button
          onClick={() => setActiveTab('PENDING_WHATSAPP')}
          className={`shrink-0 font-semibold pb-1 border-b-2 text-sm transition-colors ${activeTab === 'PENDING_WHATSAPP' ? 'border-brand-pink text-brand-pink-dark' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Pendientes ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('CONFIRMED')}
          className={`shrink-0 font-semibold pb-1 border-b-2 text-sm transition-colors ${activeTab === 'CONFIRMED' ? 'border-brand-pink text-brand-pink-dark' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Confirmados
        </button>
        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`shrink-0 font-semibold pb-1 border-b-2 text-sm transition-colors ${activeTab === 'REJECTED' ? 'border-brand-pink text-brand-pink-dark' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Rechazados
        </button>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`shrink-0 font-semibold pb-1 border-b-2 text-sm transition-colors ${activeTab === 'ALL' ? 'border-brand-pink text-brand-pink-dark' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
        >
          Todos ({orders.length})
        </button>
      </div>

      {/* Mobile Card List (visible < md) */}
      <div className="block md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No hay pedidos en esta categoría.
          </div>
        ) : (
          filteredOrders.map(order => {
            const isExpanded = expandedId === order.id;
            const itemCount = order.items.reduce((acc, i) => acc + i.quantity, 0);

            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-xs">
                {/* Header: ID + Status + Level */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    {renderBadge(order.priceLevel)}
                  </div>
                  {renderStatus(order.status)}
                </div>

                {/* Customer Details */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                    <User size={13} className="text-gray-400 shrink-0" />
                    <span className="truncate">{order.customerName || 'Cliente no identificado'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    <span>{order.customerPhone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-[11px]">
                    <Calendar size={13} className="text-gray-400 shrink-0" />
                    <span>{new Date(order.createdAt).toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {/* Total & Items summary */}
                <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <div>
                    <span className="text-[11px] text-gray-500 block">Total ({itemCount} {itemCount === 1 ? 'producto' : 'productos'})</span>
                    <span className="text-sm font-bold text-brand-pink-dark">{formatCOP(order.total)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-neutral-dark hover:text-brand-pink-dark p-1"
                  >
                    <span>{isExpanded ? 'Ocultar items' : 'Ver items'}</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Expanded items list */}
                {isExpanded && (
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-700">Detalle de Productos:</h4>
                    <div className="space-y-2">
                      {order.items.map(item => {
                        const hasStock = item.product.stock >= item.quantity;
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-xs">
                            <div className="w-10 h-10 bg-gray-200 rounded-md overflow-hidden relative shrink-0">
                              {item.imageUrl ? (
                                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">Img</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                              <div className="text-[11px] text-gray-500">
                                {item.quantity} x {formatCOP(item.priceSnapshot)}
                              </div>
                              {!hasStock && order.status === 'PENDING_WHATSAPP' && (
                                <span className="text-red-500 flex items-center gap-1 font-semibold text-[10px]">
                                  <AlertCircle className="w-3 h-3" /> Sin stock ({item.product.stock} disp.)
                                </span>
                              )}
                            </div>
                            <div className="text-right font-bold text-brand-pink-dark">
                              {formatCOP(item.priceSnapshot * item.quantity)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions for Pending */}
                {order.status === 'PENDING_WHATSAPP' && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white h-9 text-xs font-bold gap-1.5"
                      onClick={() => handleAction(order.id, 'confirm')}
                      disabled={loadingAction === order.id}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Confirmar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 h-9 text-xs font-bold gap-1.5"
                      onClick={() => handleAction(order.id, 'reject')}
                      disabled={loadingAction === order.id}
                    >
                      <XCircle className="w-4 h-4" /> Rechazar
                    </Button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table (visible >= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 font-sans">
            <tr>
              <th className="px-4 py-3 rounded-l-lg">ID</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Nivel</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 rounded-r-lg text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No hay pedidos en esta categoría.
                </td>
              </tr>
            ) : filteredOrders.map(order => (
              <React.Fragment key={order.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-gray-500">
                    #{order.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{order.customerName || '-'}</div>
                    <div className="text-xs text-gray-500">{order.customerPhone || '-'}</div>
                  </td>
                  <td className="px-4 py-3">{renderBadge(order.priceLevel)}</td>
                  <td className="px-4 py-3 font-semibold">{order.items.reduce((acc, i) => acc + i.quantity, 0)}</td>
                  <td className="px-4 py-3 font-semibold text-brand-pink-dark">{formatCOP(order.total)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('es-CO')}</td>
                  <td className="px-4 py-3">{renderStatus(order.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        className="text-gray-500"
                      >
                        {expandedId === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      {order.status === 'PENDING_WHATSAPP' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white p-2 h-8 w-8"
                            onClick={() => handleAction(order.id, 'confirm')}
                            disabled={loadingAction === order.id}
                            title="Confirmar Pedido (Descontar Stock)"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="p-2 h-8 w-8"
                            onClick={() => handleAction(order.id, 'reject')}
                            disabled={loadingAction === order.id}
                            title="Rechazar Pedido"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Expanded Details Row */}
                {expandedId === order.id && (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 bg-gray-50 border-b border-gray-100">
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="font-serif font-bold text-gray-900 mb-4">Detalle de Productos</h4>
                        <div className="space-y-3">
                          {order.items.map(item => {
                            const hasStock = item.product.stock >= item.quantity;
                            return (
                              <div key={item.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
                                  {item.imageUrl ? (
                                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">Img</div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">{item.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center gap-3">
                                    <span>Stock actual: {item.product.stock}</span>
                                    {!hasStock && order.status === 'PENDING_WHATSAPP' && (
                                      <span className="text-red-500 flex items-center gap-1 font-semibold">
                                        <AlertCircle className="w-3 h-3" /> Sin stock suficiente
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-900">{item.quantity} x {formatCOP(item.priceSnapshot)}</div>
                                  <div className="text-brand-pink-dark font-bold">{formatCOP(item.priceSnapshot * item.quantity)}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
