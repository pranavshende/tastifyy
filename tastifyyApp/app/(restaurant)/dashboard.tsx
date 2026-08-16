import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { io, Socket } from 'socket.io-client';

export default function RestaurantDashboard() {
  const { user } = useAuthStore();
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

    const newSocket = io('http://localhost:5000'); // Note: Replace with actual backend IP for physical device
    setSocket(newSocket);

    newSocket.on('connect', () => {
      api.get('/restaurants/my-restaurants').then(res => {
        if (res.data && res.data.length > 0) {
          const restId = res.data[0].id;
          newSocket.emit('join', { role: 'restaurant', id: restId });
        }
      });
    });

    newSocket.on('new_order', (data) => {
      Alert.alert('🔔 New Order!', `Order received from ${data.customerName}`);
      fetchActiveOrders();
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      await api.put(`/orders/${orderId}/status`, { status });
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
      fetchActiveOrders(); // Revert
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Live Orders</Text>
          <View style={styles.liveIndicator}>
            <View style={styles.pulse} />
            <Text style={styles.liveText}>Online</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {orders.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.iconWrap}><Text style={styles.icon}>🔔</Text></View>
            <Text style={styles.emptyTitle}>No Active Orders</Text>
            <Text style={styles.emptyText}>Waiting for customers to place orders...</Text>
          </View>
        ) : (
          orders.map(order => (
            <View key={order.id} style={[styles.card, order.status === 'pending' && styles.cardUrgent]}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.orderId}>Order #{order.id.slice(-6).toUpperCase()}</Text>
                  <Text style={styles.customerName}>{order.customer.name}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{order.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.itemsList}>
                {order.order_items.map((item: any) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemText}>{item.quantity} x {item.name_snapshot}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{parseFloat(order.total_amount).toFixed(2)}</Text>
              </View>

              {/* ACTION BUTTONS */}
              {order.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => updateStatus(order.id, 'cancelled')}>
                    <Text style={styles.rejectText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => updateStatus(order.id, 'accepted')}>
                    <Text style={styles.acceptText}>Accept Order</Text>
                  </TouchableOpacity>
                </View>
              )}

              {order.status === 'accepted' && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => updateStatus(order.id, 'preparing')}>
                  <Text style={styles.primaryBtnText}>Start Preparing</Text>
                </TouchableOpacity>
              )}

              {order.status === 'preparing' && (
                <TouchableOpacity style={styles.successBtn} onPress={() => updateStatus(order.id, 'ready_for_pickup')}>
                  <Text style={styles.successBtnText}>Mark Ready for Pickup</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: '#171717' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  liveText: { color: '#10B981', fontSize: 12, fontWeight: '800' },
  
  scroll: { padding: 16 },
  
  empty: { backgroundColor: '#fff', borderRadius: 20, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginTop: 12 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFEAE6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  icon: { fontSize: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#171717', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },

  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardUrgent: { borderColor: '#E86A22', borderWidth: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: 16, marginBottom: 16 },
  orderId: { fontSize: 18, fontWeight: '900', color: '#171717', marginBottom: 4 },
  customerName: { fontSize: 14, color: '#555', fontWeight: '600' },
  statusBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800', color: '#4B5563' },

  itemsList: { marginBottom: 16 },
  itemRow: { marginBottom: 8 },
  itemText: { fontSize: 15, color: '#333', fontWeight: '500' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: '#F9F9F9', padding: 12, borderRadius: 12 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#666' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#E86A22' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: '#EF4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginRight: 12 },
  rejectText: { color: '#EF4444', fontSize: 15, fontWeight: '800' },
  acceptBtn: { flex: 2, backgroundColor: '#E86A22', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  acceptText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  primaryBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  
  successBtn: { backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  successBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
