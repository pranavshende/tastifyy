import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import socketService from '../../api/socket';
import { MapPin, Phone, Package, CheckCircle, Navigation, Loader2 } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';

export default function DeliveryDashboard() {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [partnerStatus, setPartnerStatus] = useState('pending');
  const [stats, setStats] = useState({ today_deliveries: 0, today_earnings: 0 });
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'active'>('available');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const refreshInFlight = useRef(false);
  const activeOrderRef = useRef<any>(null);

  const fetchData = async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setDashboardError(null);
    try {
      const results = await Promise.allSettled([
        api.get('/delivery/dashboard'),
        api.get('/delivery/orders/active'),
        api.get('/delivery/orders/available')
      ]);

      const [dashResult, activeResult, availableResult] = results;
      const failedRequests = results.filter(result => result.status === 'rejected').length;
      if (failedRequests === results.length) {
        throw new Error('Unable to load dashboard');
      }
      if (failedRequests > 0) {
        setDashboardError('Some dashboard data could not be loaded. Retry to refresh.');
      }

      if (dashResult.status === 'fulfilled' && dashResult.value.data.success) {
        const data = dashResult.value.data.data || {};
        setIsOnline(Boolean(data.is_online));
        setPartnerStatus(String(data.status || 'pending'));
        setStats({
          today_deliveries: Number(data.today_deliveries || 0),
          today_earnings: Number(data.today_earnings || 0)
        });
      }

      if (activeResult.status === 'fulfilled' && activeResult.value.data.success && activeResult.value.data.data) {
        setActiveOrder(activeResult.value.data.data);
        activeOrderRef.current = activeResult.value.data.data;
        setActiveTab('active');
      } else if (activeResult.status === 'fulfilled') {
        setActiveOrder(null);
        activeOrderRef.current = null;
      }

      if (availableResult.status === 'fulfilled' && availableResult.value.data.success) {
        const orders = Array.isArray(availableResult.value.data.data) ? availableResult.value.data.data : [];
        setAvailableOrders(orders);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      setDashboardError('Unable to load dashboard. Please try again.');
    } finally {
      refreshInFlight.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Socket events handle normal updates; polling is recovery only.

    const socket = socketService.getSocket();
    const handleAssigned = () => {
      setActiveTab('active');
      fetchData();
    };
    const handleStatusUpdate = (payload: { orderId: string; status: string }) => {
      if (payload.orderId !== activeOrderRef.current?.id) {
        fetchData();
        return;
      }
      setActiveOrder((current: any) => current ? { ...current, status: payload.status } : current);
      if (activeOrderRef.current) activeOrderRef.current = { ...activeOrderRef.current, status: payload.status };
      if (payload.status === 'delivered') fetchData();
    };
    socket?.on('delivery:assigned', handleAssigned);
    socket?.on('delivery:accepted', handleAssigned);
    socket?.on('order:rider_assigned', handleAssigned);
    socket?.on('order:picked_up', handleStatusUpdate);
    socket?.on('order:out_for_delivery', handleStatusUpdate);
    socket?.on('order:delivered', handleStatusUpdate);
    socketService.setReconnectCallback(fetchData);

    return () => {
      clearInterval(interval);
      socket?.off('delivery:assigned', handleAssigned);
      socket?.off('delivery:accepted', handleAssigned);
      socket?.off('order:rider_assigned', handleAssigned);
      socket?.off('order:picked_up', handleStatusUpdate);
      socket?.off('order:out_for_delivery', handleStatusUpdate);
      socket?.off('order:delivered', handleStatusUpdate);
      socketService.setReconnectCallback(null as any);
    };
  }, []);

  const toggleStatus = async () => {
    if (!isOnline && partnerStatus !== 'active') {
      setDashboardError(partnerStatus === 'pending'
        ? 'Your rider profile is awaiting admin approval.'
        : `Your rider profile is ${partnerStatus}. Contact support before going online.`);
      return;
    }
    try {
      const newVal = !isOnline;
      setIsOnline(newVal);
      await api.patch('/delivery/status', { is_online: newVal });
      fetchData(); // refresh pool
    } catch (err) {
      setIsOnline(!isOnline); // revert
      setDashboardError('Unable to update availability. Please try again.');
    }
  };

  const acceptOrder = async (id: string) => {
    setActionLoading(true);
    setAvailableOrders(prev => prev.filter(order => order.id !== id));
    try {
      await api.post(`/delivery/orders/${id}/accept`);
      await fetchData();
    } catch (err: any) {
      await fetchData();
      alert(err.response?.data?.error?.message || 'Failed to accept order');
    } finally {
      setActionLoading(false);
    }
  };

  const updateOrderStatus = async (status: string, overrideOtp?: string) => {
    if (!activeOrder) return;
    setActionLoading(true);
    const previousOrder = activeOrder;
    try {
      const payload: any = { status };
      if (overrideOtp) {
        payload.otp = overrideOtp;
      }
      setActiveOrder((current: any) => current ? { ...current, status } : current);
      await api.patch(`/delivery/orders/${activeOrder.id}/status`, payload);
      await fetchData();
      if (status === 'delivered') {
        setShowOtpModal(false);
        setOtp('');
      }
    } catch (err: any) {
      setActiveOrder(previousOrder);
      activeOrderRef.current = previousOrder;
      alert(err.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !activeOrder && availableOrders.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
        <p className="mt-4 font-bold text-gray-700">Loading your delivery dashboard...</p>
        <p className="mt-1 text-sm text-gray-500">Fetching your availability and deliveries.</p>
        {dashboardError && (
          <button type="button" onClick={fetchData} className="mt-5 rounded-xl bg-brand-primary px-5 py-3 font-bold text-white">
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {dashboardError && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold">{dashboardError}</p>
          <button type="button" onClick={fetchData} className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white">
            Retry
          </button>
        </div>
      )}
      {/* Header & Status */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Welcome, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">
            {Number(stats.today_deliveries || 0)} deliveries today • ₹{Number(stats.today_earnings || 0).toFixed(2)} earned
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

      {partnerStatus !== 'active' && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          {partnerStatus === 'pending'
            ? 'Your rider profile is awaiting admin approval. You can accept deliveries after approval.'
            : `Your rider profile is ${partnerStatus}. Contact support before accepting deliveries.`}
        </div>
      )}

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
            {partnerStatus !== 'active' ? (
              <div className="text-center py-12 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-amber-800 font-bold">Profile approval required</p>
                <p className="text-sm text-amber-700 mt-1">Your profile must be approved before delivery requests can be accepted.</p>
              </div>
            ) : !isOnline ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-500 font-bold">You are offline</p>
                <p className="text-sm text-gray-400 mt-1">Go online to receive delivery requests.</p>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
                <CheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-bold">No active deliveries right now.</p>
                <p className="text-sm text-gray-400 mt-1">New requests will appear here when available.</p>
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
                        <div className="flex gap-2 flex-wrap">
                          {activeOrder.restaurant?.phone && (
                            <a href={`tel:${activeOrder.restaurant.phone}`} className="inline-flex items-center mt-3 text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                              <Phone className="w-4 h-4 mr-2" /> Call
                            </a>
                          )}
                          {activeOrder.restaurant && (
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${activeOrder.restaurant.latitude},${activeOrder.restaurant.longitude}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center mt-3 text-sm font-bold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-lg hover:bg-brand-primary/20">
                              <MapPin className="w-4 h-4 mr-2" /> Navigate
                            </a>
                          )}
                        </div>
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
                          {activeOrder.delivery_address?.address_line || activeOrder.delivery_address?.street_address}<br/>
                          {activeOrder.delivery_address?.apartment && <>{activeOrder.delivery_address.apartment}<br/></>}
                          {activeOrder.delivery_address?.landmark && <span className="text-gray-400">Landmark: {activeOrder.delivery_address.landmark}</span>}
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {activeOrder.customer?.phone && (
                            <a href={`tel:${activeOrder.customer.phone}`} className="inline-flex items-center mt-3 text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">
                              <Phone className="w-4 h-4 mr-2" /> Call
                            </a>
                          )}
                          {activeOrder.delivery_address && (
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${activeOrder.delivery_address.latitude},${activeOrder.delivery_address.longitude}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center mt-3 text-sm font-bold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-lg hover:bg-brand-primary/20">
                              <Navigation className="w-4 h-4 mr-2" /> Navigate
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="pb-2">
                    <h5 className="font-bold text-gray-900 mb-3 flex items-center">
                      <Package className="w-4 h-4 mr-2 text-gray-400" /> Package Contents
                    </h5>
                    <ul className="text-sm text-gray-600 space-y-2">
                      {(activeOrder.order_items || activeOrder.items)?.map((item: any) => (
                        <li key={item.id} className="flex justify-between border-b border-gray-50 pb-2">
                          <span>{item.quantity}x {item.name_snapshot}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 flex flex-col gap-3">
                    {activeOrder.status === 'rider_assigned' && (
                      <button 
                        onClick={() => updateOrderStatus('picked_up')}
                        disabled={actionLoading}
                        className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-black py-4 rounded-xl text-lg shadow-lg disabled:opacity-50"
                      >
                        {actionLoading ? 'Updating...' : 'Arrived and Picked Up'}
                      </button>
                    )}

                    {activeOrder.status === 'picked_up' && (
                      <button
                        onClick={() => updateOrderStatus('out_for_delivery')}
                        disabled={actionLoading}
                        className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-black py-4 rounded-xl text-lg shadow-lg disabled:opacity-50"
                      >
                        {actionLoading ? 'Updating...' : 'Start Delivery'}
                      </button>
                    )}
                    
                    {activeOrder.status === 'out_for_delivery' && (
                      <button 
                        onClick={() => setShowOtpModal(true)}
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
      
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-black mb-2 text-center text-gray-900">Enter Delivery OTP</h3>
            <p className="text-sm text-center text-gray-500 mb-6">Ask the customer for the 4-digit code they received via SMS.</p>
            <input 
              type="text"
              maxLength={4}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-full text-center text-3xl font-mono font-black tracking-[0.5em] bg-gray-50 border border-gray-200 rounded-xl py-4 focus:outline-none focus:ring-2 focus:ring-brand-primary mb-6"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowOtpModal(false); setOtp(''); }} className="flex-1 font-bold text-gray-500 hover:text-gray-700 py-3 rounded-xl border border-gray-200">Cancel</button>
              <button 
                onClick={() => updateOrderStatus('delivered', otp)} 
                disabled={otp.length !== 4 || actionLoading}
                className="flex-1 bg-brand-primary text-white font-black py-3 rounded-xl hover:bg-brand-secondary disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
