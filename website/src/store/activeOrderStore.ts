import { create } from 'zustand';
import api from '../api/axios';
import socketService from '../api/socket';

export interface ActiveOrder {
  id: string;
  status: string;
  created_at: string;
  total_amount: number;
  restaurant?: {
    name: string;
    logo_url?: string;
  };
}

export const ACTIVE_STATUSES = [
  'pending',
  'placed',
  'confirmed',
  'restaurant_confirmed',
  'accepted',
  'preparing',
  'ready',
  'ready_for_pickup',
  'picked_up',
  'out_for_delivery',
];

interface ActiveOrderState {
  activeOrder: ActiveOrder | null;
  isOrderDismissed: boolean;
  isLoading: boolean;
  setActiveOrder: (order: ActiveOrder | null) => void;
  setIsOrderDismissed: (dismissed: boolean) => void;
  fetchActiveOrder: () => Promise<void>;
  setupSocketListeners: () => () => void;
}

export const useActiveOrderStore = create<ActiveOrderState>((set, get) => ({
  activeOrder: null,
  isOrderDismissed: false,
  isLoading: false,

  setActiveOrder: (order) => set({ activeOrder: order }),
  setIsOrderDismissed: (isOrderDismissed) => set({ isOrderDismissed }),

  fetchActiveOrder: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get('/orders/my-orders');
      if (data.success && Array.isArray(data.data)) {
        const current = data.data.find((o: any) =>
          ACTIVE_STATUSES.includes(o.status?.toLowerCase())
        );
        const prevOrder = get().activeOrder;
        // If it's a new order, reset dismissed state
        if (current && (!prevOrder || prevOrder.id !== current.id)) {
          set({ activeOrder: current, isOrderDismissed: false, isLoading: false });
        } else {
          set({ activeOrder: current || null, isLoading: false });
        }
      } else {
        set({ activeOrder: null, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  setupSocketListeners: () => {
    const socket = socketService.getSocket();
    if (!socket) return () => {};

    const handleUpdate = (payload: any) => {
      if (!payload?.orderId) return;
      const current = get().activeOrder;
      if (!current || current.id !== payload.orderId) return;

      if (['delivered', 'cancelled', 'rejected'].includes(payload.status?.toLowerCase())) {
        set({ activeOrder: null, isOrderDismissed: false });
      } else {
        set({ activeOrder: { ...current, status: payload.status } });
      }
    };

    const events = [
      'order:restaurant_confirmed',
      'order:accepted',
      'order:preparing',
      'order:ready',
      'order:ready_for_pickup',
      'order:rider_assigned',
      'order:picked_up',
      'order:out_for_delivery',
      'order:delivered',
      'order:cancelled',
      'order:rejected',
    ];
    events.forEach((ev) => socket.on(ev, handleUpdate));

    return () => {
      events.forEach((ev) => socket.off(ev, handleUpdate));
    };
  },
}));
