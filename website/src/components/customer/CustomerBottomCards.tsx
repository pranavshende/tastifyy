import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, X, Bike, ChefHat, Clock, PackageCheck } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import socketService from '../../api/socket';

interface ActiveOrder {
  id: string;
  status: string;
  created_at: string;
  total_amount: number;
  restaurant?: {
    name: string;
    logo_url?: string;
  };
}

const ACTIVE_STATUSES = [
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

export default function CustomerBottomCards() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, getTotals } = useCartStore();

  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [isOrderDismissed, setIsOrderDismissed] = useState(false);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totals = getTotals();
  const path = location.pathname;

  // Don't show cart card on checkout page (user is already checking out)
  const isCheckoutPage = path.includes('/checkout');
  // Don't show active order card if user is currently viewing that exact order's tracking page
  const isTrackingActiveOrder = activeOrder ? path.includes(`/orders/${activeOrder.id}`) : false;

  // Fetch active orders if customer is logged in
  useEffect(() => {
    if (!user) {
      setActiveOrder(null);
      return;
    }

    const fetchActiveOrder = async () => {
      try {
        const { data } = await api.get('/orders/my-orders');
        if (data.success && Array.isArray(data.data)) {
          const current = data.data.find((o: any) =>
            ACTIVE_STATUSES.includes(o.status?.toLowerCase())
          );
          setActiveOrder(current || null);
          if (!current) {
            setIsOrderDismissed(false);
          }
        }
      } catch {
        // Silently fail if guest or network glitch
      }
    };

    fetchActiveOrder();

    // Listen to live socket updates
    const socket = socketService.getSocket();
    if (socket) {
      const handleUpdate = (payload: any) => {
        if (!payload?.orderId) return;
        setActiveOrder((prev) => {
          if (!prev || prev.id !== payload.orderId) return prev;
          if (['delivered', 'cancelled', 'rejected'].includes(payload.status?.toLowerCase())) {
            return null;
          }
          return { ...prev, status: payload.status };
        });
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
    }
  }, [user]);

  const showCartCard = totalItems > 0 && !isCheckoutPage;
  const showActiveOrderCard = Boolean(activeOrder && !isOrderDismissed && !isTrackingActiveOrder);

  if (!showCartCard && !showActiveOrderCard) {
    return null;
  }

  const getOrderStatusConfig = (status: string = '') => {
    const s = status.toLowerCase();
    if (s.includes('delivery') || s.includes('picked')) {
      return {
        label: 'Out for delivery',
        icon: <Bike className="w-4 h-4 text-emerald-600 animate-pulse" />,
        color: 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
        badge: 'bg-emerald-500 text-white',
      };
    }
    if (s.includes('ready')) {
      return {
        label: 'Order is ready',
        icon: <PackageCheck className="w-4 h-4 text-blue-600 animate-pulse" />,
        color: 'border-blue-200 bg-blue-50/90 text-blue-900',
        badge: 'bg-blue-500 text-white',
      };
    }
    if (s.includes('prep') || s.includes('accepted')) {
      return {
        label: 'Preparing your food',
        icon: <ChefHat className="w-4 h-4 text-amber-600 animate-bounce" />,
        color: 'border-amber-200 bg-amber-50/90 text-amber-900',
        badge: 'bg-amber-500 text-white',
      };
    }
    return {
      label: 'Order confirmed',
      icon: <Clock className="w-4 h-4 text-orange-600 animate-spin" />,
      color: 'border-orange-200 bg-orange-50/90 text-orange-900',
      badge: 'bg-orange-500 text-white',
    };
  };

  const orderConfig = activeOrder ? getOrderStatusConfig(activeOrder.status) : null;

  return (
    <div className="fixed bottom-16 sm:bottom-20 md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-96 z-[65] flex flex-col gap-2.5 pointer-events-none">
      {/* 1. Active Order Live Card */}
      {showActiveOrderCard && activeOrder && orderConfig && (
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-orange-200/90 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-orange-100/70 flex items-center justify-center shrink-0">
              {orderConfig.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${orderConfig.badge}`}>
                  Live Order
                </span>
                <span className="text-xs font-black text-gray-900 truncate">
                  {orderConfig.label}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                {activeOrder.restaurant?.name || 'Your order'} • ₹{activeOrder.total_amount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/customer/orders/${activeOrder.id}`)}
              className="bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1"
            >
              <span>Track</span>
              <ArrowRight className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setIsOrderDismissed(true)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Dismiss for now"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Cart Bar Card */}
      {showCartCard && (
        <div className="pointer-events-auto bg-[#1C1C1E] text-white rounded-2xl sm:rounded-full p-2.5 sm:p-3 shadow-[0_12px_36px_rgba(0,0,0,0.25)] border border-white/10 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-3 pl-1 sm:pl-2 min-w-0">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-white/10 shrink-0">
              <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2} />
              <span className="absolute -top-1 -right-1 bg-[#FF5B33] text-white text-[9.5px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-black shadow-sm">
                {totalItems}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                {totalItems} item{totalItems > 1 ? 's' : ''} in cart
              </span>
              <span className="text-sm sm:text-base font-black text-white leading-tight mt-0.5">
                ₹{totals.itemSubtotal}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/customer/checkout')}
            className="bg-gradient-to-r from-[#FF5B33] to-[#E04B28] hover:from-[#E04B28] hover:to-[#C1531A] text-white font-bold py-2 px-4 sm:py-2.5 sm:px-5 rounded-xl sm:rounded-full transition-all flex items-center gap-1.5 text-xs sm:text-sm shadow-[0_4px_14px_0_rgba(255,91,51,0.4)] shrink-0 active:scale-95"
          >
            <span>View Cart</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
