import { create } from 'zustand';

export interface CartItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  restaurantId: string | null;
  items: CartItem[];
  addItem: (restaurantId: string, item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  restaurantId: null,
  items: [],
  addItem: (newRestaurantId, item) => set((state) => {
    if (state.restaurantId && state.restaurantId !== newRestaurantId) {
      alert("You can only order from one restaurant at a time. Clear cart to continue.");
      return state;
    }
    
    const existing = state.items.find(i => i.menu_item_id === item.menu_item_id);
    if (existing) {
      return {
        restaurantId: newRestaurantId,
        items: state.items.map(i => 
          i.menu_item_id === item.menu_item_id 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      };
    }
    
    return {
      restaurantId: newRestaurantId,
      items: [...state.items, item]
    };
  }),
  removeItem: (menuItemId) => set((state) => {
    const updatedItems = state.items.filter(i => i.menu_item_id !== menuItemId);
    return {
      items: updatedItems,
      restaurantId: updatedItems.length === 0 ? null : state.restaurantId
    };
  }),
  clearCart: () => set({ restaurantId: null, items: [] }),
  getTotal: () => get().items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)
}));
