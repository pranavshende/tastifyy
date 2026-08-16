import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { io, Socket } from 'socket.io-client';
import { router } from 'expo-router';

export default function CustomerOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [riderLocations, setRiderLocations] = useState<Record<string, { lat: number, lng: number }>>({});

  // Rating Modal State
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [foodRating, setFoodRating] = useState(5);
  const [restRating, setRestRating] = useState(5);
  const [delRating, setDelRating] = useState(5);
  const [review, setReview] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      if (user) {
        newSocket.emit('join', { role: 'customer', id: user.id });
      }
    });

    newSocket.on('order_status_update', (data) => {
      setOrders(prev => prev.map(o => o.id === data.orderId ? { ...o, status: data.status } : o));
    });

    newSocket.on('rider_location_update', (data) => {
      setRiderLocations(prev => ({
        ...prev,
        [data.orderId]: { lat: data.lat, lng: data.lng }
      }));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

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

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const submitReview = async () => {
    try {
      await api.post('/reviews', {
        order_id: selectedOrderId,
        food_rating: foodRating,
        restaurant_rating: restRating,
        delivery_rating: delRating,
        review_text: review
      });
      Alert.alert('Success', 'Thank you for your feedback!');
      setRatingModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to submit review');
    }
  };

  const renderOrder = ({ item }: { item: any }) => {
    const loc = riderLocations[item.id];
    const isTracking = item.status === 'out_for_delivery' && loc;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.restInfo}>
            <Text style={styles.restName}>{item.restaurant.name}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{formatStatus(item.status)}</Text>
          </View>
        </View>

        {isTracking && (
          <View style={styles.trackingBox}>
            <View style={styles.pulse} />
            <Text style={styles.trackingText}>
              Live Location: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
            </Text>
          </View>
        )}

        <View style={styles.itemsList}>
          {item.order_items.map((oi: any) => (
            <Text key={oi.id} style={styles.itemText}>
              {oi.quantity} x {oi.name_snapshot}
            </Text>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalValue}>₹{parseFloat(item.total_amount).toFixed(2)}</Text>
        </View>

        {item.status === 'delivered' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.helpBtn} onPress={() => router.push(`/(customer)/support?orderId=${item.id}`)}>
              <Text style={styles.helpBtnText}>Get Help</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rateBtn} onPress={() => { setSelectedOrderId(item.id); setRatingModalVisible(true); }}>
              <Text style={styles.rateBtnText}>Rate Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Orders</Text>
        <Text style={styles.subtitle}>Track your live orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E86A22']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}><Text style={styles.emptyIcon}>🧾</Text></View>
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptyText}>You haven't placed any orders. Go back to the home screen to explore restaurants.</Text>
          </View>
        }
      />

      <Modal visible={ratingModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rate your experience</Text>
            
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Food Quality</Text>
              <TextInput style={styles.ratingInput} keyboardType="numeric" maxLength={1} value={String(foodRating)} onChangeText={t => setFoodRating(Number(t) || 1)} />
              <Text style={styles.ratingMax}>/ 5</Text>
            </View>

            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Restaurant</Text>
              <TextInput style={styles.ratingInput} keyboardType="numeric" maxLength={1} value={String(restRating)} onChangeText={t => setRestRating(Number(t) || 1)} />
              <Text style={styles.ratingMax}>/ 5</Text>
            </View>

            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>Delivery</Text>
              <TextInput style={styles.ratingInput} keyboardType="numeric" maxLength={1} value={String(delRating)} onChangeText={t => setDelRating(Number(t) || 1)} />
              <Text style={styles.ratingMax}>/ 5</Text>
            </View>

            <TextInput 
              style={styles.reviewInput}
              placeholder="Tell us what you liked or what went wrong..."
              multiline
              value={review}
              onChangeText={setReview}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRatingModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={submitReview}>
                <Text style={styles.modalSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 28, fontWeight: '900', color: '#171717' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  
  list: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingBottom: 12, marginBottom: 12 },
  restInfo: { flex: 1 },
  restName: { fontSize: 16, fontWeight: '800', color: '#171717', marginBottom: 2 },
  date: { fontSize: 12, color: '#888', fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginLeft: 8 },
  statusText: { fontSize: 10, fontWeight: '800' },
  
  itemsList: { marginBottom: 12 },
  itemText: { fontSize: 14, color: '#555', marginBottom: 4 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 12, borderRadius: 12 },
  totalText: { fontSize: 14, fontWeight: '600', color: '#666' },
  totalValue: { fontSize: 16, fontWeight: '900', color: '#171717' },

  actionRow: { flexDirection: 'row', marginTop: 12, justifyContent: 'space-between' },
  helpBtn: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginRight: 8 },
  helpBtnText: { color: '#4B5563', fontWeight: '700' },
  rateBtn: { flex: 1, backgroundColor: '#E86A22', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  rateBtnText: { color: '#fff', fontWeight: '700' },

  empty: { padding: 40, alignItems: 'center', marginTop: 40 },
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFEAE6', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyIcon: { fontSize: 50 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#171717', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },

  trackingBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#10B981' },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 8 },
  trackingText: { color: '#10B981', fontSize: 13, fontWeight: '800' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '900', marginBottom: 20 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratingLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: '#444' },
  ratingInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 8, width: 40, textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  ratingMax: { marginLeft: 8, fontSize: 16, color: '#888' },
  reviewInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, height: 100, marginTop: 12, textAlignVertical: 'top', backgroundColor: '#F9FAFB' },
  modalActionRow: { flexDirection: 'row', marginTop: 24 },
  modalCancel: { flex: 1, paddingVertical: 14, alignItems: 'center', marginRight: 12 },
  modalCancelText: { color: '#666', fontWeight: '700', fontSize: 16 },
  modalSubmit: { flex: 2, backgroundColor: '#E86A22', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  modalSubmitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
