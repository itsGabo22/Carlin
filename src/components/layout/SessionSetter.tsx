'use client';

import { useEffect } from 'react';
import { useSessionStore, PriceLevel } from '@/stores/sessionStore';

export function SessionSetter({ 
  priceLevel, 
  userName 
}: { 
  priceLevel: PriceLevel; 
  userName: string | null;
}) {
  const { setPriceLevel, setUserName } = useSessionStore();
  
  useEffect(() => {
    setPriceLevel(priceLevel);
    setUserName(userName);
  }, [priceLevel, userName, setPriceLevel, setUserName]);
  
  return null;
}
