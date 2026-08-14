import { create } from 'zustand';

export type PriceLevel = 'retail' | 'wholesale' | 'distributor';

interface SessionStore {
  priceLevel: PriceLevel;
  userName: string | null;
  /** % de descuento de primera compra vigente, o null si no califica. */
  welcomeDiscountPercentage: number | null;
  setPriceLevel: (level: PriceLevel) => void;
  setUserName: (name: string | null) => void;
  setWelcomeDiscountPercentage: (percentage: number | null) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  priceLevel: 'retail',
  userName: null,
  welcomeDiscountPercentage: null,
  setPriceLevel: (level) => set({ priceLevel: level }),
  setUserName: (name) => set({ userName: name }),
  setWelcomeDiscountPercentage: (percentage) => set({ welcomeDiscountPercentage: percentage }),
}));
