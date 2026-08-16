import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../../api/axios';

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const fetchActiveOrders = async () => {
    try {
      const res = await api.get('/orders/restaurant/active');
      setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to fetch active orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      // Connect to the partner's restaurant room.
      // We will need the restaurant ID. Let's fetch it or just broadcast to user ID for now?
      // Our API route emits to `restaurant_${restaurant_id}`.
      // So we need to fetch the restaurant ID associated with this partner.
      api.get('/restaurants/my-restaurants').then(res => {
        if (res.data && res.data.length > 0) {
          const restId = res.data[0].id;
          newSocket.emit('join', { role: 'restaurant', id: restId });
        }
      });
    });

    newSocket.on('new_order', (data) => {
      // Play a sound (MVP placeholder)
      console.log('🔔 RING RING! New Order:', data);
      alert(`🔔 New Order from ${data.customerName}!`);
      
      // Refresh the orders list
      fetchActiveOrders();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
      fetchActiveOrders(); // Revert on failure
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading live orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Live Orders</h1>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm font-medium text-green-700">Receiving Orders</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-4">🍽️</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Active Orders</h3>
          <p className="text-gray-500">Waiting for customers to place orders...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {orders.map(order => (
            <div key={order.id} className={`bg-white rounded-xl shadow-sm border p-6 ${order.status === 'pending' ? 'border-amber-500 ring-2 ring-amber-500 ring-opacity-20' : 'border-gray-100'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</h3>
                  <p className="text-sm text-gray-500">{order.customer.name} • {order.customer.phone}</p>
                </div>
                <div className={`px-3 py-1 rounded-md text-sm font-bold uppercase ${
                  order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'preparing' ? 'bg-indigo-100 text-indigo-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {order.status.replace('_', ' ')}
                </div>
              </div>

              <div className="border-t border-b py-4 my-4 space-y-2">
                {order.order_items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{item.quantity} x {item.name_snapshot}</span>
                    <span className="text-gray-500">₹{parseFloat(item.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-gray-600">Total</span>
                <span className="text-xl font-black text-brand">₹{parseFloat(order.total_amount).toFixed(2)}</span>
              </div>

              {/* ACTION BUTTONS */}
              {order.status === 'pending' && (
                <div className="flex space-x-3">
                  <button 
                    onClick={() => updateStatus(order.id, 'cancelled')}
                    className="flex-1 py-3 px-4 border border-red-500 text-red-500 rounded-lg font-bold hover:bg-red-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => updateStatus(order.id, 'accepted')}
                    className="flex-2 w-2/3 py-3 px-4 bg-brand text-white rounded-lg font-bold shadow-md hover:bg-brand-dark transition-colors"
                  >
                    Accept Order
                  </button>
                </div>
              )}

              {order.status === 'accepted' && (
                <button 
                  onClick={() => updateStatus(order.id, 'preparing')}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors"
                >
                  Start Preparing
                </button>
              )}

              {order.status === 'preparing' && (
                <button 
                  onClick={() => updateStatus(order.id, 'ready_for_pickup')}
                  className="w-full py-3 px-4 bg-green-500 text-white rounded-lg font-bold shadow-md hover:bg-green-600 transition-colors"
                >
                  Mark Ready for Pickup
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
