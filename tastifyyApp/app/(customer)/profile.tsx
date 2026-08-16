import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
      </View>
      <Text style={styles.name}>{user?.name || 'User'}</Text>
      <Text style={styles.email}>{user?.email || user?.phone}</Text>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5', alignItems: 'center', justifyContent: 'center', padding: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#E86A22', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', color: '#171717', marginBottom: 4 },
  email: { fontSize: 14, color: '#888', marginBottom: 32 },
  logoutBtn: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#FF4444',
    borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12,
  },
  logoutText: { color: '#FF4444', fontWeight: '700', fontSize: 15 },
});
