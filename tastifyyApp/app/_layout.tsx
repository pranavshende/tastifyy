import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { initAuth, initialized, user, loading } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      // Not authenticated — send to customer home to allow guest browsing
      router.replace('/(customer)/home');
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
        <View style={styles.logoCard}>
          <Image
            source={require('../assets/images/splash-icon.png')}
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.accent} />
        <ActivityIndicator color="#FF8A00" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
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
    backgroundColor: '#071426',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCard: {
    width: 280,
    height: 100,
    borderRadius: 20,
    backgroundColor: '#FFF4E5',
    overflow: 'hidden',
    shadowColor: '#F5BE55',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  accent: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#F5BE55',
    marginTop: 24,
  },
});
