'use client';

import { useEffect } from 'react';
import { useSessionStore, PriceLevel } from '@/stores/sessionStore';
import { useCartStore } from '@/stores/cartStore';

export function SessionSetter({
  priceLevel,
  userName,
  welcomeDiscountPercentage = null,
}: {
  priceLevel: PriceLevel;
  userName: string | null;
  welcomeDiscountPercentage?: number | null;
}) {
  const { setPriceLevel, setUserName, setWelcomeDiscountPercentage } = useSessionStore();
  // El carrito guarda su propio priceLevel y se persiste en localStorage. Nadie
  // lo sincronizaba nunca, así que se quedaba en 'retail' para siempre: el
  // resumen del carrito mostraba "Retail" a un mayorista y el pedido viajaba
  // marcado como RETAIL al mensaje de WhatsApp.
  const setCartPriceLevel = useCartStore((s) => s.setPriceLevel);

  useEffect(() => {
    setPriceLevel(priceLevel);
    setUserName(userName);
    setWelcomeDiscountPercentage(welcomeDiscountPercentage);
    setCartPriceLevel(priceLevel);
  }, [priceLevel, userName, welcomeDiscountPercentage, setPriceLevel, setUserName, setWelcomeDiscountPercentage, setCartPriceLevel]);

  return null;
}
