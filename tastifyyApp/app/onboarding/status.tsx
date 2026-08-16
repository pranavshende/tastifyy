import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function StatusScreen() {
  const { user, logout } = useAuthStore();
  const [status, setStatus] = useState<string>('loading');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const endpoint = user?.role === 'restaurant_partner' 
          ? '/onboarding/restaurant/status' 
          : '/onboarding/delivery/status';
        
        const res = await api.get(endpoint);
        if (res.data.data) {
          setStatus(res.data.data.status);
          if (res.data.data.status === 'active') {
            router.replace(`/${user?.role === 'restaurant_partner' ? '(restaurant)' : '(delivery)'}/dashboard`);
          }
        } else {
          setStatus('error');
        }
      } catch (err) {
        setStatus('error');
      }
    };
    fetchStatus();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (status === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#E86A22" />
        <Text style={{ marginTop: 16, color: '#E86A22', fontWeight: 'bold' }}>Checking application status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {status === 'pending' && (
          <>
            <View style={[styles.iconWrap, { backgroundColor: '#FFF5E6' }]}><Text style={styles.icon}>⏳</Text></View>
            <Text style={styles.title}>Application Under Review</Text>
            <Text style={styles.desc}>Your application has been submitted successfully and is currently being reviewed by our team.</Text>
          </>
        )}
        
        {status === 'rejected' && (
          <>
            <View style={[styles.iconWrap, { backgroundColor: '#FFE6E6' }]}><Text style={styles.icon}>❌</Text></View>
            <Text style={styles.title}>Application Rejected</Text>
            <Text style={styles.desc}>Unfortunately, your application was not approved. Please contact support.</Text>
          </>
        )}

        {status === 'suspended' && (
          <>
            <View style={[styles.iconWrap, { backgroundColor: '#FFE6E6' }]}><Text style={styles.icon}>⚠️</Text></View>
            <Text style={styles.title}>Account Suspended</Text>
            <Text style={styles.desc}>Your partner account is currently suspended. Please contact support.</Text>
          </>
        )}

        {status === 'error' && (
          <>
            <Text style={styles.title}>Oops!</Text>
            <Text style={styles.desc}>We couldn't load your application status. Please try again later.</Text>
          </>
        )}

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', backgroundColor: '#fff', padding: 32, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 5 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  icon: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: '900', color: '#171717', marginBottom: 12, textAlign: 'center' },
  desc: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  logoutBtn: { width: '100%', backgroundColor: '#F5F5F5', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  logoutText: { color: '#555', fontSize: 16, fontWeight: '700' },
});
