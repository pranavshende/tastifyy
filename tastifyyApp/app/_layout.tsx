import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { initAuth, initialized, user, loading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      // Not authenticated — send to universal login
      router.replace('/(auth)/login');
      return;
    }

    // Route based on role
    switch (user.role) {
      case 'customer':
        router.replace('/(customer)/home');
        break;
      case 'restaurant_partner':
        router.replace('/(restaurant)/dashboard');
        break;
      case 'delivery_partner':
        router.replace('/(delivery)/dashboard');
        break;
      case 'admin':
        router.replace('/(admin)/dashboard');
        break;
      default:
        router.replace('/(auth)/login');
    }
  }, [initialized, user]);

  // Splash / loading state
  if (!initialized || loading) {
    return (
      <View style={styles.splash}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>T</Text>
        </View>
        <Text style={styles.brand}>Tastifyy</Text>
        <ActivityIndicator color="#E86A22" style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(restaurant)" />
        <Stack.Screen name="(delivery)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="onboarding" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#FFF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#E86A22',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E86A22',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    marginBottom: 16,
  },
  logoText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '900',
  },
  brand: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: -0.5,
  },
});
