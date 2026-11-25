import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../../constants/config';
import { BrandColors } from '../../constants/theme';

export default function RestaurantDashboard() {
  const { user, token } = useAuthStore();
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

    const newSocket = io(SOCKET_URL, { auth: { token } });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      api.get('/menu/info').then(res => {
        const restId = res.data?.data?.restaurant_id;
        if (restId) newSocket.emit('join_restaurant', { restaurant_id: restId });
        newSocket.emit('join', { role: 'restaurant_partner', id: user?.id });
      });
    });

    newSocket.on('order:created', (data) => {
      Alert.alert('New Order!', `Order #${String(data.orderId).slice(-6).toUpperCase()} received.`);
      fetchActiveOrders();
    });

    newSocket.on('notification:new', (notification) => {
      Alert.alert(notification.title, notification.body);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.primary} /></View>;

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
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => updateStatus(order.id, 'restaurant_confirmed')}>
                    <Text style={styles.acceptText}>Accept Order</Text>
                  </TouchableOpacity>
                </View>
              )}

              {order.status === 'restaurant_confirmed' && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => updateStatus(order.id, 'preparing')}>
                  <Text style={styles.primaryBtnText}>Start Preparing</Text>
                </TouchableOpacity>
              )}

              {order.status === 'preparing' && (
                <TouchableOpacity style={styles.successBtn} onPress={() => updateStatus(order.id, 'ready')}>
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
  container: { flex: 1, backgroundColor: BrandColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { padding: 24, paddingTop: 60, backgroundColor: BrandColors.surface, borderBottomWidth: 1, borderBottomColor: BrandColors.border },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '900', color: BrandColors.text },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: BrandColors.secondaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: BrandColors.secondary, marginRight: 6 },
  liveText: { color: BrandColors.secondary, fontSize: 12, fontWeight: '800' },
  
  scroll: { padding: 16 },
  
  empty: { backgroundColor: BrandColors.surface, borderRadius: 20, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3, marginTop: 12 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: BrandColors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  icon: { fontSize: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: BrandColors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: BrandColors.textMuted, textAlign: 'center', lineHeight: 22 },

  card: { backgroundColor: BrandColors.surface, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardUrgent: { borderColor: BrandColors.primary, borderWidth: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: BrandColors.background, paddingBottom: 16, marginBottom: 16 },
  orderId: { fontSize: 18, fontWeight: '900', color: BrandColors.text, marginBottom: 4 },
  customerName: { fontSize: 14, color: BrandColors.textSecondary, fontWeight: '600' },
  statusBadge: { backgroundColor: BrandColors.backgroundMuted, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '800', color: BrandColors.textSecondary },

  itemsList: { marginBottom: 16 },
  itemRow: { marginBottom: 8 },
  itemText: { fontSize: 15, color: BrandColors.text, fontWeight: '500' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, backgroundColor: BrandColors.background, padding: 12, borderRadius: 12 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: BrandColors.textSecondary },
  totalValue: { fontSize: 18, fontWeight: '900', color: BrandColors.primary },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  rejectBtn: { flex: 1, borderWidth: 1, borderColor: '#EF4444', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginRight: 12 },
  rejectText: { color: '#EF4444', fontSize: 15, fontWeight: '800' },
  acceptBtn: { flex: 2, backgroundColor: BrandColors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  acceptText: { color: BrandColors.surface, fontSize: 15, fontWeight: '800' },

  primaryBtn: { backgroundColor: BrandColors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: BrandColors.surface, fontSize: 15, fontWeight: '800' },
  
  successBtn: { backgroundColor: BrandColors.secondary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  successBtnText: { color: BrandColors.surface, fontSize: 15, fontWeight: '800' },
});
