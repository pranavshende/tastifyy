import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../../api/axios';
import { io, Socket } from 'socket.io-client';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../store/authStore';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ lat: number, lng: number } | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        setOrder(res.data.data);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load order details');
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (user) {
        newSocket.emit('join', { role: 'customer', id: user.id });
      }
    });

    newSocket.on('order_status_update', (data) => {
      if (data.orderId === id) {
        setOrder((prev: any) => ({ ...prev, status: data.status }));
      }
    });

    newSocket.on('rider_location_update', (data) => {
      if (data.orderId === id) {
        setRiderLocation({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [id, user]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;
  if (!order) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#F59E0B'; // Amber
      case 'accepted':
      case 'preparing': return '#3B82F6'; // Blue
      case 'ready_for_pickup':
      case 'out_for_delivery': return '#8B5CF6'; // Purple
      case 'delivered': return '#10B981'; // Green
      case 'cancelled': return '#EF4444'; // Red
      default: return '#6B7280'; // Gray
    }
  };

  const isTracking = order.status === 'out_for_delivery' && riderLocation;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#171717" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.id.slice(-6).toUpperCase()}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Status Card */}
        <View style={[styles.card, { borderTopWidth: 4, borderTopColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusLabel}>Current Status</Text>
          <Text style={[styles.statusValue, { color: getStatusColor(order.status) }]}>
            {order.status.replace(/_/g, ' ').toUpperCase()}
          </Text>
          
          {isTracking && (
            <View style={styles.trackingBox}>
              <View style={styles.pulse} />
              <Text style={styles.trackingText}>
                Live: {riderLocation.lat.toFixed(4)}, {riderLocation.lng.toFixed(4)}
              </Text>
            </View>
          )}
        </View>

        {/* Restaurant Info */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Restaurant</Text>
          <Text style={styles.restName}>{order.restaurant.name}</Text>
          <Text style={styles.restAddress}>{order.restaurant.address}</Text>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.order_items.map((item: any) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemQty}>{item.quantity}x</Text>
                <Text style={styles.itemName}>{item.name_snapshot}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{(item.price_snapshot * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Bill Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{(parseFloat(order.total_amount) - 45).toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes & Fees</Text>
            <Text style={styles.billValue}>₹45.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>₹{parseFloat(order.total_amount).toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.supportBtn} onPress={() => router.push(`/(customer)/support?orderId=${order.id}`)}>
          <Ionicons name="help-buoy-outline" size={20} color="#171717" style={{ marginRight: 8 }} />
          <Text style={styles.supportBtnText}>Get Support for this Order</Text>
        </TouchableOpacity>
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#171717' },

  scroll: { padding: 16, paddingBottom: 40 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#171717', marginBottom: 16 },
  
  statusLabel: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 4 },
  statusValue: { fontSize: 24, fontWeight: '900' },
  
  trackingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 12, borderRadius: 8, marginTop: 16, borderWidth: 1, borderColor: '#10B981' },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
  trackingText: { color: '#10B981', fontSize: 13, fontWeight: '800' },

  restName: { fontSize: 18, fontWeight: '700', color: '#171717', marginBottom: 4 },
  restAddress: { fontSize: 14, color: '#666' },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  itemLeft: { flexDirection: 'row', flex: 1 },
  itemQty: { fontSize: 14, fontWeight: '700', color: '#E86A22', marginRight: 8 },
  itemName: { fontSize: 14, color: '#333', fontWeight: '500', flex: 1 },
  itemPrice: { fontSize: 14, fontWeight: '600', color: '#171717' },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  billLabel: { fontSize: 14, color: '#666' },
  billValue: { fontSize: 14, color: '#333', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
  totalLabel: { fontSize: 16, fontWeight: '800', color: '#171717' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#171717' },

  supportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 8
  },
  supportBtnText: { fontSize: 15, fontWeight: '700', color: '#171717' }
});
