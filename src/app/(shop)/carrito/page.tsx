'use client';

import * as React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Trash2, Plus, Minus, ShoppingBag, Tag, CheckCircle2, Gift, TrendingDown, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useSessionStore } from '@/stores/sessionStore';
import { formatCOP } from '@/lib/utils/carlin-pricing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const orderSchema = z.object({
  customerName: z.string().min(2, 'El nombre es obligatorio'),
  customerPhone: z.string().min(7, 'El teléfono es obligatorio'),
});

type OrderFormValues = z.infer<typeof orderSchema>;

/**
 * Respuesta de `/api/carrito/cotizar`: el tramo, los umbrales y los importes
 * calculados EN EL SERVIDOR con los precios de la base de datos.
 *
 * El carrito guarda el precio congelado al añadir cada producto (siempre el de
 * mayorista, el del catálogo). Desde que el precio de distribuidor se gana por
 * tamaño de pedido, ese precio deja de ser el que se cobra en cuanto el carrito
 * pasa del umbral, así que los importes que se PINTAN salen de aquí y no de
 * `getSubtotal()`. Reimplementar la regla en el cliente la desincronizaría (y
 * el cliente no es fuente de verdad para dinero).
 */
interface Quote {
  priceLevel: 'retail' | 'wholesale' | 'distributor';
  escalated: boolean;
  subtotal: number;
  baseSubtotal: number;
  meetsMinimum: boolean;
  minimumRequired: number;
  missing: number;
  escalationThreshold: number;
  missingForEscalation: number;
  minimumMessage: string | null;
  couponDiscountAmount: number;
  couponError: string | null;
  welcomeDiscountPercentage: number | null;
  welcomeDiscountAmount: number;
  total: number;
  lines: {
    productId: string;
    variantId: string | null;
    name: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
}

export default function CarritoPage() {
  const {
    items,
    priceLevel,
    appliedCoupon,
    removeItem,
    updateQuantity,
    setCoupon,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    clearCart,
  } = useCartStore();

  const welcomeDiscountPercentage = useSessionStore((s) => s.welcomeDiscountPercentage);

  const [quote, setQuote] = React.useState<Quote | null>(null);
  const [isQuoting, setIsQuoting] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [couponInput, setCouponInput] = React.useState('');
  const [couponError, setCouponError] = React.useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
  });

  // Hydration fix for Zustand
  const [isHydrated, setIsHydrated] = React.useState(false);
  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Firma del carrito: sólo QUÉ se pide. Así la cotización se repite cuando
  // cambian los productos o las cantidades, pero no en cada render.
  const cartSignature = React.useMemo(
    () =>
      JSON.stringify(
        items.map((i) => [i.productId, i.variantId ?? null, i.quantity]),
      ) + `|${appliedCoupon?.couponCode ?? ''}`,
    [items, appliedCoupon?.couponCode]
  );

  React.useEffect(() => {
    if (!isHydrated) return;
    if (items.length === 0) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    setIsQuoting(true);

    fetch('/api/carrito/cotizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId || null,
          quantity: i.quantity,
        })),
        couponCode: appliedCoupon?.couponCode ?? null,
      }),
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled) return;
        // Si la cotización falla se deja `quote` en null: la vista cae a los
        // importes locales del carrito y el envío lo sigue validando el
        // servidor, así que nunca se cobra por lo que se pintó aquí.
        setQuote(ok ? (d as Quote) : null);
      })
      .catch(() => {
        if (!cancelled) setQuote(null);
      })
      .finally(() => {
        if (!cancelled) setIsQuoting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cartSignature, isHydrated, items, appliedCoupon?.couponCode]);

  if (!isHydrated) return null;

  // Importes LOCALES: sólo se usan como respaldo mientras la cotización viaja
  // (o si falla). Los precios del carrito están congelados al añadir, así que
  // no conocen el escalado a precio distribuidor.
  const localSubtotal = getSubtotal();
  const localDiscountAmount = getDiscountAmount();

  // Lo que se pinta sale de la cotización del servidor cuando la hay.
  const subtotal = quote ? quote.subtotal : localSubtotal;
  const discountAmount = quote ? quote.couponDiscountAmount : localDiscountAmount;
  const welcomeDiscountAmount = quote ? quote.welcomeDiscountAmount : 0;
  const total = quote ? quote.total : getTotal();
  const effectivePriceLevel = quote ? quote.priceLevel : priceLevel;
  const welcomePct = quote ? quote.welcomeDiscountPercentage : welcomeDiscountPercentage;
  const blockedByMinimum = !!quote && !quote.meetsMinimum;

  const PRICE_LEVEL_LABEL: Record<string, string> = {
    retail: 'Detal',
    wholesale: 'Mayorista',
    distributor: 'Distribuidor',
  };

  /**
   * Precio unitario a mostrar en cada línea. Sale de la cotización del
   * servidor, porque `item.price` quedó congelado al añadir el producto y no
   * refleja el escalado a precio distribuidor. Si no hay cotización todavía,
   * se muestra el congelado.
   */
  const unitPriceOf = (item: { productId: string; variantId?: string | null; price: number }) =>
    quote?.lines.find(
      (l) => l.productId === item.productId && l.variantId === (item.variantId ?? null)
    )?.unitPrice ?? item.price;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const res = await fetch('/api/cupones/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponInput.trim(),
          items: items.map((i) => ({ productId: i.productId, price: i.price, quantity: i.quantity })),
          priceLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al validar el cupón');
      }

      setCoupon({
        discountId: data.discountId,
        couponCode: data.couponCode,
        label: data.label,
        percentage: data.percentage,
        discountAmount: data.discountAmount,
        applicableProductIds: data.applicableProductIds,
      });
      setCouponInput('');
    } catch (err: any) {
      setCouponError(err.message || 'Error al validar el cupón');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };

  const onSubmit = async (data: OrderFormValues) => {
    if (items.length === 0) return;
    // El servidor lo rechazaría igual; esto evita el viaje inútil.
    if (quote && !quote.meetsMinimum) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/ordenes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || null,
            colorName: item.colorName || null,
            colorHex: item.colorHex || null,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
          })),
          subtotal,
          couponCode: appliedCoupon?.couponCode || null,
          couponLabel: appliedCoupon?.label || null,
          couponDiscountAmount: discountAmount,
          // Informativo: el servidor recalcula el descuento de bienvenida y su
          // valor es el que manda, tanto en el pedido como en el mensaje.
          welcomeDiscountAmount,
          total,
          priceLevel,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar el pedido');
      }

      const result = await response.json();
      
      // Clear cart
      clearCart();
      
      // Redirect to WhatsApp
      window.location.href = result.whatsappUrl;

    } catch (err: any) {
      console.error('Error in checkout submit:', err);
      setError(err.message || 'Ocurrió un error al procesar el pedido. Por favor intenta de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-serif text-3xl font-bold text-brand-pink-dark mb-8 flex items-center gap-3">
        <ShoppingBag className="w-8 h-8" />
        Mi Carrito
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-2xl shadow-sm border border-brand-pink-light/20">
          <p className="text-gray-500 font-sans mb-4">Tu carrito está vacío.</p>
          <Button onClick={() => window.location.href = '/catalogo'} className="bg-brand-pink hover:bg-brand-pink-dark text-white rounded-full">
            Explorar catálogo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => {
              const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
              return (
                <div key={key} className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-brand-pink-light/20 items-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-brand-cream rounded-xl overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">Sin img</div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-brand-text truncate">{item.name}</h3>
                    {item.colorName && (
                      <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-600 font-sans">
                        {item.colorHex && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                            style={{ backgroundColor: item.colorHex }}
                          />
                        )}
                        <span>Color: <strong>{item.colorName}</strong></span>
                      </div>
                    )}
                    <div className="font-sans text-brand-pink-dark font-semibold mt-1">
                      {formatCOP(unitPriceOf(item))}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-2 bg-brand-cream rounded-full p-1 border border-brand-pink-light/30">
                        <button 
                          onClick={() => updateQuantity(key, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-brand-pink-dark shadow-sm disabled:opacity-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-sans text-sm font-semibold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button 
                          onClick={() => updateQuantity(key, item.quantity + 1)}
                          disabled={item.quantity >= item.maxStock}
                          className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-brand-pink-dark shadow-sm disabled:opacity-50"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <button 
                      onClick={() => removeItem(key)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="font-sans font-bold text-brand-text text-right mt-auto">
                      {formatCOP(unitPriceOf(item) * item.quantity)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-pink-light/20 sticky top-28">
              <h2 className="font-serif text-xl font-bold text-brand-text mb-4">Resumen de Pedido</h2>
              
              <div className="flex justify-between py-3 border-b border-gray-100 font-sans text-gray-600">
                <span>Nivel de precio</span>
                <span
                  className={`font-semibold ${
                    effectivePriceLevel === 'distributor'
                      ? 'text-brand-distributor-dark'
                      : 'text-brand-pink-dark'
                  }`}
                >
                  {PRICE_LEVEL_LABEL[effectivePriceLevel] ?? effectivePriceLevel}
                </span>
              </div>

              {/* Ya se ganó el precio de distribuidor por tamaño de pedido. */}
              {quote?.escalated && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-distributor/40 bg-brand-distributor/10 px-3 py-2.5">
                  <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-brand-distributor-dark" />
                  <p className="text-[11px] leading-snug font-sans text-brand-distributor-dark">
                    <strong className="font-bold">¡Precio de distribuidor aplicado!</strong> Tu
                    pedido alcanzó {formatCOP(quote.escalationThreshold)}, así que cada producto
                    baja a su precio de distribuidor. A precio mayorista este pedido habría
                    costado {formatCOP(quote.baseSubtotal)}.
                  </p>
                </div>
              )}

              {/* Le falta poco: se le dice cuánto para el siguiente tramo. */}
              {quote && quote.meetsMinimum && !quote.escalated && quote.missingForEscalation > 0 && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-brand-pink-light/40 bg-brand-cream px-3 py-2.5">
                  <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-brand-pink-dark" />
                  <p className="text-[11px] leading-snug font-sans text-brand-pink-dark">
                    Te faltan{' '}
                    <strong className="font-bold">{formatCOP(quote.missingForEscalation)}</strong>{' '}
                    para llegar a {formatCOP(quote.escalationThreshold)} y que todo tu pedido pase
                    automáticamente a <strong className="font-bold">precio de distribuidor</strong>.
                  </p>
                </div>
              )}
              
              <div className="space-y-2 py-3 border-b border-gray-100 font-sans text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-text">{formatCOP(subtotal)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-medium items-center">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      Cupón ({appliedCoupon.couponCode})
                    </span>
                    <span>-{formatCOP(discountAmount)}</span>
                  </div>
                )}

                {welcomeDiscountAmount > 0 && (
                  <div className="flex justify-between text-brand-pink-dark font-semibold items-center gap-2">
                    <span className="flex items-center gap-1 min-w-0">
                      <Gift className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Bienvenida ({welcomePct}%)</span>
                    </span>
                    <span className="shrink-0">-{formatCOP(welcomeDiscountAmount)}</span>
                  </div>
                )}
              </div>

              {welcomeDiscountAmount > 0 && (
                <div className="mt-3 rounded-xl bg-brand-cream border border-brand-pink-light/40 px-3 py-2.5">
                  <p className="text-[11px] leading-snug text-brand-pink-dark font-sans">
                    <strong className="font-bold">🎁 Tu descuento de primera compra</strong> se aplicó
                    automáticamente. Sólo válido en este, tu primer pedido.
                  </p>
                </div>
              )}

              <div className="flex justify-between py-4 font-sans text-lg font-bold text-brand-text">
                <span>Total Estimado</span>
                <span className="text-brand-pink-dark">{formatCOP(total)}</span>
              </div>

              {/* Sección de Cupón de Descuento */}
              <div className="mt-2 pt-3 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  ¿Tienes un cupón de descuento?
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-800 uppercase tracking-wider">{appliedCoupon.couponCode}</p>
                        <p className="text-emerald-600">{appliedCoupon.label} ({appliedCoupon.percentage}% OFF)</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-xs ml-2"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        placeholder="Ej. VERANO20"
                        className="rounded-xl border-gray-200 text-sm uppercase"
                      />
                      <Button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponInput.trim()}
                        className="bg-brand-pink text-white hover:bg-brand-pink-dark rounded-xl px-4 text-xs font-bold uppercase tracking-wider shrink-0"
                      >
                        {isValidatingCoupon ? '...' : 'Aplicar'}
                      </Button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-500 font-medium">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-text mb-1.5">Nombre Completo</label>
                  <Input 
                    {...register('customerName')} 
                    placeholder="Ej. María Pérez" 
                    className="rounded-xl border-gray-200 focus-visible:ring-brand-pink"
                  />
                  {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-brand-text mb-1.5">Teléfono (WhatsApp)</label>
                  <Input 
                    {...register('customerPhone')} 
                    placeholder="Ej. 3001234567" 
                    className="rounded-xl border-gray-200 focus-visible:ring-brand-pink"
                  />
                  {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone.message}</p>}
                </div>

                <p className="text-xs text-gray-500 font-sans text-center mt-2">
                  Solo usamos estos datos para identificar tu pedido.
                </p>

                {/*
                  No llega al mínimo. El servidor bloquea el pedido de todas
                  formas (/api/ordenes devuelve 400); esto sólo evita que el
                  cliente lo descubra al final y le dice cuánto le falta.
                */}
                {blockedByMinimum && quote && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="font-sans text-xs leading-snug text-amber-900">
                      <p className="font-bold">
                        Te faltan {formatCOP(quote.missing)} para el pedido mínimo
                      </p>
                      <p className="mt-1">
                        El pedido mínimo para mayoristas es{' '}
                        {formatCOP(quote.minimumRequired)} y tu carrito suma{' '}
                        {formatCOP(quote.baseSubtotal)}. Agrega{' '}
                        {formatCOP(quote.missing)} más para poder confirmarlo.
                      </p>
                    </div>
                  </div>
                )}

                {quote?.couponError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-sans">
                    {quote.couponError}
                  </div>
                )}

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-sans">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isSubmitting || isQuoting || blockedByMinimum}
                  className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full font-bold shadow-md shadow-green-500/20 py-6 disabled:opacity-60"
                >
                  {isSubmitting
                    ? 'Generando...'
                    : blockedByMinimum && quote
                      ? `Faltan ${formatCOP(quote.missing)} para el mínimo`
                      : 'Generar pedido y contactar por WhatsApp'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
