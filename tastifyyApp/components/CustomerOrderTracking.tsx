import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { io, Socket } from 'socket.io-client';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { SOCKET_URL } from '../constants/config';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerOrderTracking({ orderId }: { orderId: string }) {
  const { user } = useAuthStore();
  const [status, setStatus] = React.useState('pending');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();

    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      if (user?.id) socket.emit('join', { role: 'customer', id: user.id });
    });

    const statusEvents = [
      'order:restaurant_confirmed', 'order:preparing', 'order:ready', 
      'order:rider_assigned', 'order:picked_up', 'order:out_for_delivery', 
      'order:delivered', 'order:cancelled', 'order:rejected'
    ];

    statusEvents.forEach(event => {
      socket.on(event, (data) => {
        if (data.orderId === orderId) setStatus(data.status);
      });
    });

    return () => { socket.disconnect(); };
  }, [user?.id, orderId]);

  const getStatusText = () => {
    const s = status.replace(/_/g, ' ').toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const getStatusColor = () => {
    switch(status) {
      case 'pending': return '#F59E0B';
      case 'restaurant_confirmed': case 'preparing': return '#3B82F6';
      case 'ready': case 'rider_assigned': case 'picked_up': case 'out_for_delivery': return '#8B5CF6';
      case 'delivered': return '#10B981';
      case 'cancelled': case 'rejected': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Live Tracking</Text>
        <Ionicons name="location-sharp" size={24} color={getStatusColor()} />
      </View>
      
      <View style={[styles.statusBox, { borderColor: getStatusColor() + '40', backgroundColor: getStatusColor() + '10' }]}>
        <Animated.View style={[styles.pulse, { backgroundColor: getStatusColor(), transform: [{ scale: pulseAnim }] }]} />
        <Text style={[styles.status, { color: getStatusColor() }]}>{getStatusText()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', borderRadius: 16, marginVertical: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '900', color: '#171717' },
  statusBox: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1 },
  pulse: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  status: { fontSize: 16, fontWeight: '800' }
});
