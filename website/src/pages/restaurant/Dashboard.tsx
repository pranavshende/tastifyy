import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../../api/axios';

export default function RestaurantDashboard() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // Note: User holds the restaurant_partner ID. We need the restaurant ID.
    // For MVP, assuming the user's active restaurant ID is fetched somehow or we broadcast to a general partner room.
    // Let's connect socket and wait for `new_order` event.
    const newSocket = io('http://localhost:5000');

    newSocket.on('connect', () => {
      // We need the restaurant ID to join `restaurant_${restaurantId}`. 
      // In MVP, we might join using user id if there is a 1:1 mapping, 
      // but the API emits to `restaurant_${order.restaurant_id}`.
      // So let's fetch my restaurants first.
      api.get('/restaurants/my-restaurants').then(res => {
        const myRestaurants = res.data;
        if (myRestaurants.length > 0) {
          const restaurantId = myRestaurants[0].id;
          newSocket.emit('join', { role: 'restaurant', id: restaurantId });
        }
      });
    });

    newSocket.on('new_order', (data) => {
      // Fetch full order details when pinged
      api.get(`/orders/${data.orderId}`).then(res => {
        setOrders(prev => [res.data, ...prev]);
      }).catch(err => console.error(err));
    });

    newSocket.on('order_status_update', (data) => {
      setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Live Orders</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500">You have no active orders right now.</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="border p-4 rounded-lg flex justify-between items-center">
              <div>
                <h3 className="font-bold">Order #{order.id.slice(-6).toUpperCase()}</h3>
                <p className="text-sm text-gray-600">Status: <span className="font-semibold text-orange-600">{order.status}</span></p>
                <p className="text-sm">Total: ₹{order.total_amount}</p>
              </div>
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button onClick={() => updateStatus(order.id, 'restaurant_confirmed')} className="bg-blue-600 text-white px-3 py-1 rounded">Accept</button>
                )}
                {order.status === 'restaurant_confirmed' && (
                  <button onClick={() => updateStatus(order.id, 'preparing')} className="bg-orange-600 text-white px-3 py-1 rounded">Preparing</button>
                )}
                {order.status === 'preparing' && (
                  <button onClick={() => updateStatus(order.id, 'ready')} className="bg-green-600 text-white px-3 py-1 rounded">Ready</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
