import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { MapPin, Phone, Package, CheckCircle, Navigation, Loader2 } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';

export default function DeliveryDashboard() {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState({ today_deliveries: 0, today_earnings: 0 });
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'active'>('available');

  const fetchData = async () => {
    try {
      const [dashRes, activeRes, availableRes] = await Promise.all([
        api.get('/delivery/dashboard'),
        api.get('/delivery/orders/active'),
        api.get('/delivery/orders/available')
      ]);

      if (dashRes.data.success) {
        setIsOnline(dashRes.data.data.is_online);
        setStats({
          today_deliveries: dashRes.data.data.today_deliveries,
          today_earnings: dashRes.data.data.today_earnings
        });
      }

      if (activeRes.data.success && activeRes.data.data.length > 0) {
        setActiveOrder(activeRes.data.data[0]);
        setActiveTab('active');
      } else {
        setActiveOrder(null);
      }

      if (availableRes.data.success) {
        setAvailableOrders(availableRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const toggleStatus = async () => {
    try {
      const newVal = !isOnline;
      setIsOnline(newVal);
      await api.patch('/delivery/status', { is_online: newVal });
      fetchData(); // refresh pool
    } catch (err) {
      setIsOnline(!isOnline); // revert
    }
  };

  const acceptOrder = async (id: string) => {
    setActionLoading(true);
    try {
      await api.post(`/delivery/orders/${id}/accept`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to accept order');
    } finally {
      setActionLoading(false);
    }
  };

  const updateOrderStatus = async (status: string) => {
    if (!activeOrder) return;
    setActionLoading(true);
    try {
      await api.patch(`/delivery/orders/${activeOrder.id}/status`, { status });
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !activeOrder && availableOrders.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            {stats.today_deliveries} deliveries today • ₹{stats.today_earnings.toFixed(2)} earned
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 p-2 pr-4 rounded-xl border border-gray-100">
          <button 
            onClick={toggleStatus}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
          <span className={`font-bold text-sm ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-200/50 rounded-xl w-full max-w-sm">
        <button
          onClick={() => setActiveTab('available')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'available' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Available Pool ({availableOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Active Delivery {activeOrder && '🟢'}
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'available' && (
          <div className="space-y-4">
            {!isOnline ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-500 font-bold">You are offline</p>
                <p className="text-sm text-gray-400 mt-1">Go online to receive delivery requests.</p>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-bold">Waiting for orders...</p>
                <p className="text-sm text-gray-400 mt-1">Stay in high-demand areas to get more requests.</p>
              </div>
            ) : (
              availableOrders.map(order => (
                <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-md">
                      Earn ₹{order.estimated_earnings}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">#{order.id.slice(0,6).toUpperCase()}</span>
                  </div>
                  
                  <div className="space-y-4 mb-5">
                    <div className="flex gap-3">
                      <div className="mt-1"><MapPin className="w-5 h-5 text-gray-400" /></div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Pickup</p>
                        <p className="font-bold text-gray-900">{order.restaurant?.name}</p>
                        <p className="text-sm text-gray-500 line-clamp-1">{order.restaurant?.address_line}, {order.restaurant?.city}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="mt-1"><Navigation className="w-5 h-5 text-brand-primary" /></div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Dropoff</p>
                        <p className="font-bold text-gray-900">{order.customer?.name}</p>
                        <p className="text-sm text-gray-500">View map on acceptance</p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => acceptOrder(order.id)}
                    disabled={actionLoading || !!activeOrder}
                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    {activeOrder ? 'Finish active order first' : 'Accept Order'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'active' && (
          <div>
            {!activeOrder ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-bold">No active delivery</p>
                <p className="text-sm text-gray-400 mt-1">Check the Available Pool for new orders.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-brand-primary/20 overflow-hidden">
                <div className="bg-brand-dark text-white p-5 text-center">
                  <h3 className="font-black text-lg">Current Delivery</h3>
                  <p className="text-brand-primary/80 font-mono text-sm mt-1">#{activeOrder.id.slice(0,8).toUpperCase()}</p>
                  <div className="mt-3 inline-block">
                    <StatusBadge status={activeOrder.status} />
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Restaurant Info */}
                  <div className="border-b border-gray-100 pb-5">
                    <div className="flex gap-3 items-start">
                      <MapPin className="w-6 h-6 text-gray-400 shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-1">1. Pickup Location</p>
                        <h4 className="font-black text-lg text-gray-900">{activeOrder.restaurant?.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{activeOrder.restaurant?.address_line}, {activeOrder.restaurant?.city}</p>
                        {activeOrder.restaurant?.phone && (
                          <a href={`tel:${activeOrder.restaurant.phone}`} className="inline-flex items-center mt-3 text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                            <Phone className="w-4 h-4 mr-2" /> Call Restaurant
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="border-b border-gray-100 pb-5">
                    <div className="flex gap-3 items-start">
                      <Navigation className="w-6 h-6 text-brand-primary shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-1">2. Drop-off Location</p>
                        <h4 className="font-black text-lg text-gray-900">{activeOrder.customer?.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {activeOrder.delivery_address?.street_address}<br/>
                          {activeOrder.delivery_address?.apartment && <>{activeOrder.delivery_address.apartment}<br/></>}
                          {activeOrder.delivery_address?.landmark && <span className="text-gray-400">Landmark: {activeOrder.delivery_address.landmark}</span>}
                        </p>
                        {activeOrder.customer?.phone && (
                          <a href={`tel:${activeOrder.customer.phone}`} className="inline-flex items-center mt-3 text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                            <Phone className="w-4 h-4 mr-2" /> Call Customer
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="pb-2">
                    <h5 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Package className="w-4 h-4 mr-2 text-gray-400" /> Package Contents
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-2">
                      {activeOrder.items?.map((item: any) => (
                        <li key={item.id} className="flex justify-between border-b border-gray-50 pb-2">
                          <span>{item.quantity}x {item.name_snapshot}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 flex flex-col gap-3">
                    {activeOrder.status === 'ready_for_pickup' && (
                      <button 
                        onClick={() => updateOrderStatus('out_for_delivery')}
                        disabled={actionLoading}
                        className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-black py-4 rounded-xl text-lg shadow-lg disabled:opacity-50"
                      >
                        {actionLoading ? 'Updating...' : 'Confirm Pickup'}
                      </button>
                    )}
                    
                    {activeOrder.status === 'out_for_delivery' && (
                      <button 
                        onClick={() => updateOrderStatus('delivered')}
                        disabled={actionLoading}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl text-lg shadow-lg disabled:opacity-50"
                      >
                        {actionLoading ? 'Updating...' : 'Mark as Delivered'}
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
