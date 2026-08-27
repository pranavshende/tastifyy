import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';

export default function LandingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>T</Text>
          </View>
          <Text style={styles.brand}>Tastifyy</Text>
        </View>

        <Text style={styles.title}>Food delivery at your fingertips.</Text>
        <Text style={styles.subtitle}>Order from your favorite restaurants, track live, and enjoy fresh food.</Text>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.primaryBtnText}>Log In / Sign Up</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/(customer)/home')}>
            <Text style={styles.secondaryBtnText}>Browse as Guest</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Are you a restaurant owner?{' '}
          <Text 
            style={styles.link} 
            onPress={() => router.push('/(auth)/register-restaurant' as any)}
          >
            Partner with us
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F5',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
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
    fontSize: 42,
    fontWeight: '900',
  },
  brand: {
    fontSize: 32,
    fontWeight: '900',
    color: '#171717',
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#171717',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  buttons: {
    width: '100%',
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: '#E86A22',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#E86A22',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  secondaryBtnText: {
    color: '#171717',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  link: {
    color: '#E86A22',
    fontWeight: '700',
  },
});
