import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, X, Bike, ChefHat, Clock, PackageCheck } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { useActiveOrderStore } from '../../store/activeOrderStore';

export default function CustomerBottomCards() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, getTotals } = useCartStore();
  const { 
    activeOrder, 
    isOrderDismissed, 
    setIsOrderDismissed, 
    fetchActiveOrder, 
    setupSocketListeners 
  } = useActiveOrderStore();

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totals = getTotals();
  const path = location.pathname;

  // Don't show cart card on checkout page (user is already checking out)
  const isCheckoutPage = path.includes('/checkout');
  // Don't show active order card if user is currently viewing that exact order's tracking page
  const isTrackingActiveOrder = activeOrder ? path.includes(`/orders/${activeOrder.id}`) : false;

  // Fetch active orders and bind sockets if customer is logged in
  useEffect(() => {
    if (user) {
      fetchActiveOrder();
      const cleanup = setupSocketListeners();
      return cleanup;
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
        label: 'Preparing food',
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
    <div className="fixed bottom-[60px] sm:bottom-[68px] md:bottom-6 left-2.5 right-[74px] sm:left-4 sm:right-[84px] md:left-6 md:right-auto md:w-[380px] z-[65] flex flex-col gap-2 pointer-events-none transition-all duration-300">
      {/* 1. Active Order Live Card */}
      {showActiveOrderCard && activeOrder && orderConfig && (
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-2 sm:p-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-orange-200/90 flex items-center justify-between gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100/80 flex items-center justify-center shrink-0">
              {orderConfig.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 min-w-0">
                <span className={`text-[8.5px] font-black uppercase px-1 py-0.2 rounded shrink-0 ${orderConfig.badge}`}>
                  Live
                </span>
                <span className="text-xs font-black text-gray-900 truncate">
                  {orderConfig.label}
                </span>
              </div>
              <p className="text-[10.5px] text-gray-500 font-medium truncate mt-0.5">
                {activeOrder.restaurant?.name || 'Your order'} • ₹{activeOrder.total_amount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => navigate(`/customer/orders/${activeOrder.id}`)}
              className="bg-brand-primary hover:bg-brand-secondary text-white text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95"
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
        <div className="pointer-events-auto bg-[#1C1C1E] text-white rounded-2xl sm:rounded-full p-2 sm:p-2.5 pl-2.5 pr-2 sm:px-3 shadow-[0_10px_28px_rgba(0,0,0,0.25)] border border-white/10 flex items-center justify-between gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 shrink-0">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2} />
              <span className="absolute -top-1 -right-1 bg-[#FF5B33] text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border border-black shadow-sm">
                {totalItems}
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9.5px] text-gray-400 font-bold uppercase tracking-wider leading-none truncate">
                {totalItems} item{totalItems > 1 ? 's' : ''}
              </span>
              <span className="text-xs sm:text-sm font-black text-white leading-tight mt-0.5 truncate">
                ₹{totals.itemSubtotal}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/customer/checkout')}
            className="bg-gradient-to-r from-[#FF5B33] to-[#E04B28] hover:from-[#E04B28] hover:to-[#C1531A] text-white font-bold py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl sm:rounded-full transition-all flex items-center gap-1 text-[11px] sm:text-xs shadow-[0_4px_14px_0_rgba(255,91,51,0.4)] shrink-0 active:scale-95 whitespace-nowrap"
          >
            <span>View Cart</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
