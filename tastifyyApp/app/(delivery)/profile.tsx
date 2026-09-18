import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

export default function DeliveryProfile() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/delivery/dashboard')
      .then(res => setStats(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rider Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.charAt(0) || 'R'}</Text></View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.phone}>+91 {user?.phone}</Text>
          <View style={[styles.badge, stats?.status === 'approved' ? styles.badgeActive : styles.badgePending]}>
            <Text style={[styles.badgeText, stats?.status === 'approved' ? styles.badgeTextActive : styles.badgeTextPending]}>
              {stats?.status === 'approved' ? 'Verified Partner' : 'Verification Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Today's Performance</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{stats?.today_deliveries || 0}</Text>
              <Text style={styles.statLbl}>Deliveries</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>₹{stats?.today_earnings || 0}</Text>
              <Text style={styles.statLbl}>Earnings</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 28, fontWeight: '900', color: '#171717' },
  
  content: { padding: 24 },
  
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  name: { fontSize: 24, fontWeight: '800', color: '#171717', marginBottom: 4 },
  phone: { fontSize: 16, color: '#888', marginBottom: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeActive: { backgroundColor: '#ECFDF5' },
  badgePending: { backgroundColor: '#FFFBEB' },
  badgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  badgeTextActive: { color: '#10B981' },
  badgeTextPending: { color: '#F59E0B' },

  statsCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 32 },
  statsTitle: { fontSize: 16, fontWeight: '800', color: '#171717', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16, alignItems: 'center', marginHorizontal: 4 },
  statVal: { fontSize: 24, fontWeight: '900', color: '#E86A22', marginBottom: 4 },
  statLbl: { fontSize: 13, color: '#666', fontWeight: '600' },

  logoutBtn: { backgroundColor: '#FFEAE6', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  logoutText: { color: '#E83A22', fontSize: 16, fontWeight: '800' },
});
