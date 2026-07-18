import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PriceLevel } from '@prisma/client';

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  maxStock: number;
}

// In the database PriceLevel is uppercase (RETAIL, WHOLESALE, DISTRIBUTOR)
// In the frontend it might be lowercase, but the schema uses the enum.
// We'll define a local type for the frontend to match the store.
export type CartPriceLevel = 'retail' | 'wholesale' | 'distributor';

interface CartState {
  items: CartItem[];
  priceLevel: CartPriceLevel;
  setPriceLevel: (level: CartPriceLevel) => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      priceLevel: 'retail',
      setPriceLevel: (level) => set({ priceLevel: level }),
      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find((i) => i.productId === item.productId);
        const qtyToAdd = item.quantity || 1;
        
        if (existingItem) {
          const newQuantity = Math.min(existingItem.quantity + qtyToAdd, existingItem.maxStock);
          set({
            items: items.map((i) =>
              i.productId === item.productId ? { ...i, quantity: newQuantity } : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: qtyToAdd }] });
        }
      },
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.min(Math.max(1, quantity), i.maxStock) } : i
          ),
        })),
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      }
    }),
    {
      name: 'carlin-cart',
    }
  )
);
