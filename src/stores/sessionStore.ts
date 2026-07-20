import { create } from 'zustand';

export type PriceLevel = 'retail' | 'wholesale' | 'distributor';

interface SessionStore {
  priceLevel: PriceLevel;
  userName: string | null;
  setPriceLevel: (level: PriceLevel) => void;
  setUserName: (name: string | null) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  priceLevel: 'retail',
  userName: null,
  setPriceLevel: (level) => set({ priceLevel: level }),
  setUserName: (name) => set({ userName: name }),
}));
