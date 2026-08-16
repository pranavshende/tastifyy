import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, FlatList, TouchableOpacity, Alert } from 'react-native';
import { io, Socket } from 'socket.io-client';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function DeliveryHomeScreen() {
  const { user } = useAuthStore();
  const [isOnline, setIsOnline] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // In MVP, we just connect to the root URL
    const newSocket = io('http://localhost:5000'); 
    
    newSocket.on('connect', () => {
      if (user?.id) {
        newSocket.emit('join', { role: 'partner', id: user.id });
      }
    });

    newSocket.on('order_status_update', (data) => {
      // If an order we accepted changes status (e.g. cancelled)
      Alert.alert('Order Update', `Order ${data.orderId} status changed to ${data.status}`);
    });

    // Mocking an incoming delivery request
    newSocket.on('new_delivery_request', (data) => {
      if (isOnline) {
        setRequests(prev => [...prev, data]);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user?.id, isOnline]);

  const toggleOnline = () => {
    setIsOnline(!isOnline);
    // Ideally we update the backend DB DeliveryPartner is_online status here
  };

  const handleAccept = async (orderId: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, {
        status: 'rider_assigned',
        delivery_partner_id: user?.id
      });
      setRequests(prev => prev.filter(r => r.id !== orderId));
      Alert.alert('Success', 'Order accepted! Navigate to pickup.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to accept order.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Delivery Dashboard</Text>
        <View style={styles.toggleRow}>
          <Text>{isOnline ? 'Online' : 'Offline'}</Text>
          <Switch value={isOnline} onValueChange={toggleOnline} />
        </View>
      </View>

      {!isOnline && (
        <View style={styles.center}>
          <Text>Go online to receive delivery requests.</Text>
        </View>
      )}

      {isOnline && (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          ListEmptyComponent={<View style={styles.center}><Text>Waiting for orders...</Text></View>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pickup from {item.restaurantName}</Text>
              <Text>Est. Earning: ₹{item.earning}</Text>
              <Text>Distance: {item.distance} km</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => setRequests(prev => prev.filter(r => r.id !== item.id))}>
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  acceptBtn: { backgroundColor: '#28a745', padding: 10, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  rejectBtn: { backgroundColor: '#dc3545', padding: 10, borderRadius: 8, flex: 0.48, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
