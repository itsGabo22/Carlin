'use client';

import { useEffect } from 'react';
import { useSessionStore, PriceLevel } from '@/stores/sessionStore';

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

  useEffect(() => {
    setPriceLevel(priceLevel);
    setUserName(userName);
    setWelcomeDiscountPercentage(welcomeDiscountPercentage);
  }, [priceLevel, userName, welcomeDiscountPercentage, setPriceLevel, setUserName, setWelcomeDiscountPercentage]);

  return null;
}
