import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { BrandColors } from '../../constants/theme';

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
  container: { flex: 1, backgroundColor: BrandColors.background },
  header: { padding: 24, paddingTop: 60, backgroundColor: BrandColors.surface, borderBottomWidth: 1, borderBottomColor: BrandColors.border },
  title: { fontSize: 28, fontWeight: '900', color: BrandColors.text },
  content: { padding: 24, flex: 1, justifyContent: 'center' },
  
  card: { backgroundColor: BrandColors.surface, borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 4, marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: BrandColors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '900', color: BrandColors.surface },
  name: { fontSize: 24, fontWeight: '800', color: BrandColors.text, marginBottom: 4 },
  phone: { fontSize: 16, color: BrandColors.textMuted, marginBottom: 16 },
  badge: { backgroundColor: BrandColors.secondaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: BrandColors.secondary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },

  logoutBtn: { backgroundColor: BrandColors.primaryLight, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  logoutText: { color: BrandColors.primaryDark, fontSize: 16, fontWeight: '800' },
});
