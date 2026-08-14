import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  variantId?: string | null;
  colorName?: string | null;
  colorHex?: string | null;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  maxStock: number;
}

export type CartPriceLevel = 'retail' | 'wholesale' | 'distributor';

export interface AppliedCoupon {
  discountId: string;
  couponCode: string;
  label: string;
  percentage: number;
  discountAmount: number;
  applicableProductIds: string[];
}

interface CartState {
  items: CartItem[];
  priceLevel: CartPriceLevel;
  appliedCoupon: AppliedCoupon | null;
  setPriceLevel: (level: CartPriceLevel) => void;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export function getItemKey(item: { productId: string; variantId?: string | null }): string {
  return item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      priceLevel: 'retail',
      appliedCoupon: null,
      setPriceLevel: (level) => set({ priceLevel: level }),
      addItem: (item) => {
        const { items } = get();
        const targetKey = getItemKey(item);
        const existingItem = items.find((i) => getItemKey(i) === targetKey);
        const qtyToAdd = item.quantity || 1;
        
        if (existingItem) {
          const newQuantity = Math.min(existingItem.quantity + qtyToAdd, existingItem.maxStock);
          set({
            items: items.map((i) =>
              getItemKey(i) === targetKey ? { ...i, quantity: newQuantity } : i
            ),
          });
        } else {
          set({ items: [...items, { ...item, quantity: qtyToAdd }] });
        }
      },
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => getItemKey(i) !== key && i.productId !== key),
        })),
      updateQuantity: (key, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            getItemKey(i) === key || i.productId === key ? { ...i, quantity: Math.min(Math.max(1, quantity), i.maxStock) } : i
          ),
        })),
      setCoupon: (coupon) => set({ appliedCoupon: coupon }),
      clearCart: () => set({ items: [], appliedCoupon: null }),
      getSubtotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      getDiscountAmount: () => {
        const { items, appliedCoupon } = get();
        if (!appliedCoupon) return 0;
        const percentage = appliedCoupon.percentage / 100;
        const appSet = new Set(appliedCoupon.applicableProductIds);
        
        let discountTotal = 0;
        for (const item of items) {
          if (appSet.has(item.productId)) {
            discountTotal += (item.price * percentage) * item.quantity;
          }
        }
        return Math.round(discountTotal);
      },
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discountAmount = get().getDiscountAmount();
        return Math.max(0, subtotal - discountAmount);
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
