import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function RestaurantProfile() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Partner Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.charAt(0) || 'P'}</Text></View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.phone}>+91 {user?.phone}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>Active Partner</Text></View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 28, fontWeight: '900', color: '#171717' },
  content: { padding: 24, flex: 1, justifyContent: 'center' },
  
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E86A22', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  name: { fontSize: 24, fontWeight: '800', color: '#171717', marginBottom: 4 },
  phone: { fontSize: 16, color: '#888', marginBottom: 16 },
  badge: { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: '#10B981', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },

  logoutBtn: { backgroundColor: '#FFEAE6', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  logoutText: { color: '#E83A22', fontSize: 16, fontWeight: '800' },
});
