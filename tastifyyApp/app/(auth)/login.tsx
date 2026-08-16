import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    if (mode === 'register' && (!name.trim() || !phone.trim())) {
      Alert.alert('Missing Fields', 'Please enter your name and phone number.');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (mode === 'register') {
        res = await api.post('/auth/register', { email, password, name, phone, role: 'customer' });
      } else {
        res = await api.post('/auth/login', { email, password });
      }

      const token = res.data.session?.access_token;
      if (!token || !res.data.user) throw new Error('Invalid server response');

      await setAuth(res.data.user, token);
      // Root layout's useEffect will handle the navigation
    } catch (err: any) {
      const msg = err.response?.data?.error?.message
        || err.response?.data?.error
        || err.message
        || 'Authentication failed. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestBrowse = () => {
    // Customers can browse restaurants without logging in
    router.replace('/(customer)/home');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header / Brand */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>T</Text>
          </View>
          <Text style={styles.brand}>Tastifyy</Text>
          <Text style={styles.tagline}>
            {mode === 'login' ? 'Welcome back! 👋' : 'Join thousands of food lovers'}
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => setMode('login')}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'register' && styles.tabActive]}
            onPress={() => setMode('register')}
          >
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === 'register' && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#aaa"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 98765 43210"
                placeholderTextColor="#aaa"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </>
          )}

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest Browse */}
          <TouchableOpacity style={styles.ghostBtn} onPress={handleGuestBrowse}>
            <Text style={styles.ghostBtnText}>Browse as Guest 🍕</Text>
          </TouchableOpacity>

          {/* Become a Partner link */}
          <TouchableOpacity style={styles.partnerLink}>
            <Text style={styles.partnerLinkText}>
              Want to list your restaurant?{' '}
              <Text style={styles.partnerLinkHighlight}>Become a Partner →</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: '#E86A22',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E86A22', shadowOpacity: 0.35,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 10, marginBottom: 12,
  },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  brand: { fontSize: 26, fontWeight: '900', color: '#171717', letterSpacing: -0.5, marginBottom: 6 },
  tagline: { fontSize: 15, color: '#888', fontWeight: '500' },

  tabs: {
    flexDirection: 'row', backgroundColor: '#F0F0F0',
    borderRadius: 14, padding: 4, marginBottom: 28,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#E86A22', fontWeight: '700' },

  form: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#171717',
    borderWidth: 1.5, borderColor: '#EEE',
  },

  primaryBtn: {
    backgroundColor: '#E86A22', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
    shadowColor: '#E86A22', shadowOpacity: 0.3,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#EEE' },
  dividerText: { marginHorizontal: 12, color: '#AAA', fontWeight: '500', fontSize: 13 },

  ghostBtn: {
    borderWidth: 1.5, borderColor: '#E86A22', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  ghostBtnText: { color: '#E86A22', fontSize: 15, fontWeight: '700' },

  partnerLink: { marginTop: 20, alignItems: 'center' },
  partnerLinkText: { fontSize: 13, color: '#888', textAlign: 'center' },
  partnerLinkHighlight: { color: '#E86A22', fontWeight: '700' },

  footer: { marginTop: 32, textAlign: 'center', fontSize: 11, color: '#BBB', lineHeight: 16 },
});
