import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axios';
import { Package, Clock, Check, X, ChefHat, TrendingUp, AlertCircle } from 'lucide-react';
import socketService from '../../api/socket';

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/restaurant/active');
      if (data.success) {
        setOrders(data.data);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    api.get('/menu/info').then(({ data }) => {
      if (data.success && data.data.restaurant_id) {
        socketService.joinRestaurant(data.data.restaurant_id);
      }
    });

    socketService.setReconnectCallback(fetchOrders);

    const socket = socketService.getSocket();
    if (socket) {
      const handleNewOrder = (payload: any) => {
        setOrders(prev => {
          if (prev.find(o => o.id === payload.orderId)) return prev;
          const newOrder = {
            id: payload.orderId,
            status: payload.status,
            created_at: payload.created_at,
            total_amount: payload.totalAmount,
            customer: payload.customer,
            order_items: payload.order_items,
          };
          return [...prev, newOrder];
        });
      };

      socket.on('order:created', handleNewOrder);
      return () => {
        socket.off('order:created', handleNewOrder);
        socketService.setReconnectCallback(null as any);
      };
    }
  }, []);

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { data } = await api.put(`/orders/${orderId}/status`, { status });
      if (data.success) {
        const terminalStatuses = ['delivered', 'cancelled'];
        if (terminalStatuses.includes(status)) {
          setOrders(prev => prev.filter(o => o.id !== orderId));
        } else {
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        }
      }
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  // Group orders for Kanban board
  const newOrders = useMemo(() => orders.filter(o => o.status === 'pending' || o.status === 'restaurant_confirmed'), [orders]);
  const preparingOrders = useMemo(() => orders.filter(o => o.status === 'preparing'), [orders]);
  const readyOrders = useMemo(() => orders.filter(o => o.status === 'ready' || o.status === 'out_for_delivery'), [orders]);

  // Stat calculation
  const totalActive = orders.length;
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);

  const renderOrderCard = (order: any, actionButton: React.ReactNode) => (
    <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col mb-3 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm font-black text-gray-900">#{order.id.split('-')[0].toUpperCase()}</div>
          <div className="flex items-center text-xs font-bold text-gray-500 mt-1">
            <Clock className="w-3 h-3 mr-1" />
            {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-xs font-bold">
          ₹{order.total_amount}
        </div>
      </div>

      <div className="flex-1 mb-4">
        <div className="font-bold text-gray-900 mb-2 truncate">{order.customer?.name}</div>
        <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-2 border border-gray-100">
          {order.order_items?.map((item: any) => (
            <div key={item.id} className="flex justify-between font-medium text-gray-700">
              <span className="truncate pr-2"><span className="font-bold text-gray-900">{item.quantity}x</span> {item.name_snapshot}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 flex gap-2">
        {actionButton}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header & Stats */}
      <div className="mb-6 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Kitchen Display</h1>
            <p className="text-gray-500 font-medium text-sm mt-0.5">Manage active orders in real-time</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">Active</p>
                <p className="text-2xl font-black text-gray-900">{totalActive}</p>
              </div>
            </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mr-3">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Preparing</p>
                <p className="text-xl font-black text-gray-900">{preparingOrders.length}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
              <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center mr-3">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Ready</p>
                <p className="text-xl font-black text-gray-900">{readyOrders.length}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center mr-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase">Value</p>
                <p className="text-xl font-black text-gray-900">₹{totalSales.toFixed(0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        {loading && orders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 font-bold flex items-center">
            <AlertCircle className="w-6 h-6 mr-3" /> {error}
          </div>
        ) : (
          <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
            
            {/* Column 1: New / Confirmed */}
            <div className="bg-gray-100/60 rounded-2xl p-3 flex flex-col min-w-[300px] max-w-[320px] snap-start border border-gray-200">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-black text-gray-900 flex items-center">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-2"></div>
                  NEW ORDERS
                </h2>
                <span className="bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-full text-xs">{newOrders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-4">
                {newOrders.map(order => renderOrderCard(order, 
                  order.status === 'pending' ? (
                    <>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'restaurant_confirmed')}
                        className="flex-1 bg-brand-primary text-white py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-brand-secondary transition-colors"
                      >
                        <Check className="w-4 h-4 mr-1.5" /> Accept
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="px-4 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold flex items-center justify-center hover:bg-red-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="w-full bg-purple-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-purple-700 transition-colors shadow-sm"
                    >
                      <ChefHat className="w-4 h-4 mr-2" /> Start Preparing
                    </button>
                  )
                ))}
              </div>
            </div>

            {/* Column 2: Preparing */}
            <div className="bg-gray-100/60 rounded-2xl p-3 flex flex-col min-w-[300px] max-w-[320px] snap-start border border-gray-200">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-black text-gray-900 flex items-center">
                  <div className="w-2.5 h-2.5 bg-purple-500 rounded-full mr-2"></div>
                  PREPARING
                </h2>
                <span className="bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-full text-xs">{preparingOrders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-4">
                {preparingOrders.map(order => renderOrderCard(order, 
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Package className="w-4 h-4 mr-2" /> Mark Ready
                  </button>
                ))}
              </div>
            </div>

            {/* Column 3: Ready */}
            <div className="bg-gray-100/60 rounded-2xl p-3 flex flex-col min-w-[300px] max-w-[320px] snap-start border border-gray-200">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-sm font-black text-gray-900 flex items-center">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2"></div>
                  READY / PICKUP
                </h2>
                <span className="bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-full text-xs">{readyOrders.length}</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-4">
                {readyOrders.map(order => renderOrderCard(order, 
                  <button 
                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                    className="w-full bg-green-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <Check className="w-4 h-4 mr-2" /> Complete Order
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}
    </div>
  );
}
