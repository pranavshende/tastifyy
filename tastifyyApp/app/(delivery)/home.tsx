import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../../api/axios';

export default function DeliveryHomeScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStatus = async () => {
    try {
      const res = await api.get('/delivery/dashboard');
      setIsOnline(res.data.data.is_online);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      // Check if we have an active assigned order first
      const activeRes = await api.get('/delivery/orders/active');
      if (activeRes.data.data) {
        setActiveOrder(activeRes.data.data);
        setAvailableOrders([]);
      } else {
        setActiveOrder(null);
        // If no active order, fetch available ones (pool)
        if (isOnline) {
          const availRes = await api.get('/delivery/orders/available');
          setAvailableOrders(availRes.data.data);
        } else {
          setAvailableOrders([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStatus().then(fetchOrders);
  }, []);

  useEffect(() => {
    fetchOrders();

    // PHASE I: Connect to socket to emit live location
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isOnline]);

  useEffect(() => {
    // PHASE I: Simulate GPS location emission
    let locationInterval: NodeJS.Timeout;
    
    if (activeOrder && activeOrder.status === 'out_for_delivery' && socket) {
      // Mock starting coordinates
      let currentLat = 12.9716;
      let currentLng = 77.5946;

      locationInterval = setInterval(() => {
        // Simulate slight movement
        currentLat += 0.0001;
        currentLng += 0.0001;

        console.log('📍 Emitting GPS:', currentLat, currentLng);
        socket.emit('update_location', {
          customerId: activeOrder.customer_id,
          orderId: activeOrder.id,
          lat: currentLat,
          lng: currentLng
        });
      }, 3000); // Every 3 seconds
    }

    return () => {
      if (locationInterval) clearInterval(locationInterval);
    };
  }, [activeOrder, socket]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardStatus().then(fetchOrders);
  };

  const toggleOnline = async () => {
    const newState = !isOnline;
    setIsOnline(newState);
    try {
      await api.patch('/delivery/status', { is_online: newState });
    } catch (err) {
      setIsOnline(!newState); // revert
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleAccept = async (orderId: string) => {
    try {
      await api.post(`/delivery/orders/${orderId}/accept`);
      Alert.alert('Success', 'Order accepted! Navigate to pickup.');
      fetchOrders();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to accept order.');
      fetchOrders();
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (err) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Delivery Dashboard</Text>
          <Text style={styles.subtitle}>{isOnline ? 'Waiting for orders...' : 'Go online to receive orders'}</Text>
        </View>
        <Switch 
          value={isOnline} 
          onValueChange={toggleOnline} 
          trackColor={{ false: '#D1D5DB', true: '#10B981' }}
          thumbColor="#fff"
        />
      </View>

      {/* ACTIVE ORDER VIEW */}
      {activeOrder ? (
        <View style={styles.activeContainer}>
          <View style={styles.activeCard}>
            <View style={styles.badge}><Text style={styles.badgeText}>CURRENT ASSIGNMENT</Text></View>
            
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>PICKUP FROM</Text>
              <Text style={styles.infoTitle}>{activeOrder.restaurant.name}</Text>
              <Text style={styles.infoDetail}>{activeOrder.restaurant.address_line}, {activeOrder.restaurant.city}</Text>
            </View>
            
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>DELIVER TO</Text>
              <Text style={styles.infoTitle}>{activeOrder.customer.name}</Text>
              <Text style={styles.infoDetail}>{activeOrder.delivery_address.street_address}, {activeOrder.delivery_address.city}</Text>
            </View>

            <View style={styles.statusBlock}>
              <Text style={styles.infoLabel}>STATUS</Text>
              <Text style={styles.statusCurrent}>{activeOrder.status.replace('_', ' ').toUpperCase()}</Text>
            </View>

            {/* ACTION BUTTONS */}
            {activeOrder.status === 'ready_for_pickup' && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => updateOrderStatus(activeOrder.id, 'out_for_delivery')}>
                <Text style={styles.actionBtnText}>Confirm Pickup</Text>
              </TouchableOpacity>
            )}

            {activeOrder.status === 'out_for_delivery' && (
              <TouchableOpacity style={[styles.actionBtn, styles.deliverBtn]} onPress={() => updateOrderStatus(activeOrder.id, 'delivered')}>
                <Text style={styles.actionBtnText}>Mark Delivered</Text>
              </TouchableOpacity>
            )}
            
            {/* If restaurant is still preparing, rider just waits */}
            {(activeOrder.status === 'accepted' || activeOrder.status === 'preparing') && (
              <View style={styles.waitBlock}>
                <ActivityIndicator color="#E86A22" />
                <Text style={styles.waitText}>Waiting for restaurant to prep...</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        /* AVAILABLE ORDERS (POOL) VIEW */
        <FlatList
          data={availableOrders}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E86A22']} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🛵</Text>
              <Text style={styles.emptyTitle}>{isOnline ? 'No orders nearby' : 'You are offline'}</Text>
              <Text style={styles.emptyText}>{isOnline ? "We'll notify you when an order comes in." : "Toggle your status to start earning."}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.restaurant.name}</Text>
                <Text style={styles.cardAmount}>₹30</Text> {/* MVP Flat Rate */}
              </View>
              <Text style={styles.cardDetail}>Pickup: {item.restaurant.city}</Text>
              <Text style={styles.cardDetail}>Dropoff: {item.delivery_address.city}</Text>
              
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                <Text style={styles.acceptBtnText}>Accept Delivery</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#171717' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 4 },
  
  list: { padding: 16 },
  empty: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#171717', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#171717' },
  cardAmount: { fontSize: 18, fontWeight: '900', color: '#10B981' },
  cardDetail: { fontSize: 14, color: '#555', marginBottom: 4 },
  acceptBtn: { backgroundColor: '#E86A22', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 12 },
  acceptBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  activeContainer: { padding: 16 },
  activeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 5, borderWidth: 2, borderColor: '#10B981' },
  badge: { backgroundColor: '#ECFDF5', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 20 },
  badgeText: { color: '#10B981', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  infoBlock: { marginBottom: 20 },
  infoLabel: { fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 4, letterSpacing: 0.5 },
  infoTitle: { fontSize: 18, fontWeight: '800', color: '#171717', marginBottom: 2 },
  infoDetail: { fontSize: 14, color: '#555' },
  statusBlock: { marginBottom: 24, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  statusCurrent: { fontSize: 16, fontWeight: '900', color: '#3B82F6' },
  
  actionBtn: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center' },
  deliverBtn: { backgroundColor: '#3B82F6' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  
  waitBlock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5E6', padding: 16, borderRadius: 12 },
  waitText: { color: '#E86A22', fontWeight: '700', marginLeft: 12 },
});
