import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  customizations?: any;
}

interface CartTotals {
  itemSubtotal: number;
  deliveryFee: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
}

interface CartState {
  restaurantId: string | null;
  items: CartItem[];
  addItem: (item: CartItem, restaurantId: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotals: () => CartTotals;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      items: [],

      addItem: (item, restaurantId) => {
        set((state) => {
          // If adding from a different restaurant, clear the cart first
          if (state.restaurantId && state.restaurantId !== restaurantId) {
            return {
              restaurantId,
              items: [item],
            };
          }

          const existingItemIndex = state.items.findIndex(
            (i) => i.menu_item_id === item.menu_item_id
          );

          if (existingItemIndex >= 0) {
            const newItems = [...state.items];
            newItems[existingItemIndex].quantity += item.quantity;
            return { restaurantId, items: newItems };
          }

          return {
            restaurantId,
            items: [...state.items, item],
          };
        });
      },

      removeItem: (menuItemId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.menu_item_id !== menuItemId);
          return {
            items: newItems,
            // Clear restaurantId if cart becomes empty
            restaurantId: newItems.length === 0 ? null : state.restaurantId,
          };
        });
      },

      updateQuantity: (menuItemId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            const newItems = state.items.filter((i) => i.menu_item_id !== menuItemId);
            return {
              items: newItems,
              restaurantId: newItems.length === 0 ? null : state.restaurantId,
            };
          }

          return {
            items: state.items.map((i) =>
              i.menu_item_id === menuItemId ? { ...i, quantity } : i
            ),
          };
        });
      },

      clearCart: () => {
        set({ restaurantId: null, items: [] });
      },

      getTotals: () => {
        const state = get();
        const itemSubtotal = state.items.reduce(
          (sum, item) => sum + Number(item.price) * item.quantity,
          0
        );

        // Standard fees as defined in MVP backend
        const deliveryFee = itemSubtotal > 0 ? 40 : 0;
        const platformFee = itemSubtotal > 0 ? 10 : 0;
        const taxAmount = itemSubtotal * 0.05;
        const totalAmount = itemSubtotal + deliveryFee + platformFee + taxAmount;

        return {
          itemSubtotal,
          deliveryFee,
          platformFee,
          taxAmount,
          totalAmount,
        };
      },
    }),
    {
      name: 'tastifyy-cart', // key in local storage
    }
  )
);
