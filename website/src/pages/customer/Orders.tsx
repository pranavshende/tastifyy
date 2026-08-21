import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Clock, ChevronRight, ArrowLeft, ReceiptText } from 'lucide-react';
import socketService from '../../api/socket';
import ImageWithFallback from '../../components/ui/ImageWithFallback';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'past'>('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/orders/my-orders');
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
    fetchOrders();

    // On reconnect, re-fetch to get latest order states
    socketService.setReconnectCallback(fetchOrders);

    // Real-time Socket Event Listeners
    const socket = socketService.getSocket();
    if (socket) {
      const handleStatusUpdate = (payload: any) => {
        setOrders(prev => prev.map(o => o.id === payload.orderId ? { ...o, status: payload.status, cancellation_reason: payload.cancellation_reason || o.cancellation_reason } : o));
      };

      const events = ['order:accepted', 'order:rejected', 'order:preparing', 'order:ready_for_pickup', 'order:delivered', 'order:cancelled'];
      events.forEach(event => socket.on(event, handleStatusUpdate));

      return () => {
        events.forEach(event => socket.off(event, handleStatusUpdate));
        socketService.setReconnectCallback(null as any);
      };
    }
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      restaurant_confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-purple-100 text-purple-800',
      ready: 'bg-indigo-100 text-indigo-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  // Filter and Sort Orders
  const filteredOrders = orders.filter(order => {
    const isPast = ['delivered', 'cancelled', 'rejected'].includes(order.status);
    if (activeTab === 'active') return !isPast;
    if (activeTab === 'past') return isPast;
    return true; // 'all'
  }).sort((a, b) => {
    // Active orders always on top when viewing 'all'
    const aIsPast = ['delivered', 'cancelled', 'rejected'].includes(a.status);
    const bIsPast = ['delivered', 'cancelled', 'rejected'].includes(b.status);
    if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
    
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center">
          <Link to="/customer/home" className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 text-gray-600 transition-colors mr-3">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">My Orders</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tabs */}
        <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl mb-8 overflow-x-auto scrollbar-hide">
          {['all', 'active', 'past'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 min-w-[100px] py-2.5 px-4 rounded-lg font-bold text-sm capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl h-32 shadow-sm animate-pulse border border-gray-100"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10 bg-white rounded-xl border border-red-100">
            <p className="text-red-500 font-bold">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ReceiptText className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900">No {activeTab !== 'all' ? activeTab : ''} orders yet</h3>
            <p className="mt-2 text-gray-500 font-medium">Looks like you haven't placed any orders recently.</p>
            <Link 
              to="/customer/home"
              className="mt-6 inline-block px-8 py-3.5 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary transition-all shadow-md"
            >
              Start ordering
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredOrders.map(order => (
              <Link 
                key={order.id} 
                to={`/customer/orders/${order.id}`}
                className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-brand-primary/30 transition-all hover:shadow-md group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-50 shadow-inner">
                      {order.restaurant?.logo_url ? (
                        <ImageWithFallback src={order.restaurant.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-secondary to-brand-primary text-white font-black text-xl">
                          {order.restaurant?.name?.charAt(0) || 'R'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-gray-900 text-lg group-hover:text-brand-primary transition-colors">{order.restaurant?.name}</h3>
                      <div className="flex items-center text-xs font-bold text-gray-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(order.created_at).toLocaleString('en-IN', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-sm ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-sm font-medium text-gray-600 line-clamp-2">
                    {order.order_items?.map((item: any) => `${item.quantity} x ${item.name_snapshot}`).join(', ')}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                  <span className="font-bold text-gray-900">₹{order.total_amount}</span>
                  <div className="flex items-center text-sm font-medium text-brand-primary">
                    View Details
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
