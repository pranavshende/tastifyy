import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { io, Socket } from 'socket.io-client';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function CustomerOrderTracking({ orderId }: { orderId: string }) {
  const { user } = useAuthStore();
  const [status, setStatus] = React.useState('pending');

  useEffect(() => {
    const socket = io('http://localhost:5000');
    
    socket.on('connect', () => {
      if (user?.id) {
        socket.emit('join', { role: 'customer', id: user.id });
      }
    });

    socket.on('order_status_update', (data) => {
      if (data.orderId === orderId) {
        setStatus(data.status);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, orderId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Live Order Tracking</Text>
      <Text style={styles.status}>Status: {status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', borderRadius: 10, marginVertical: 10 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  status: { fontSize: 16, color: '#E86A22' }
});
