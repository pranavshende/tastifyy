import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { router } from 'expo-router';
import api from '../../api/axios';

export default function RegisterRestaurantScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || !restaurantName.trim() || !phone.trim()) {
      Alert.alert('Missing Fields', 'Please fill out all fields.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create a user account with role 'restaurant_partner'
      const res = await api.post('/auth/register', { 
        email, 
        password, 
        name: restaurantName + ' Admin', 
        phone, 
        role: 'restaurant_partner' 
      });

      if (!res.data.user) throw new Error('Registration failed');

      // Note: We're simply registering the user here. 
      // The user would then need to log in, and the backend might require additional 
      // setup to create the actual Restaurant entity linked to this user.
      // Or they can complete the onboarding from the dashboard.
      
      Alert.alert('Success', 'Partner account created! Please log in to complete your setup.');
      router.replace('/(auth)/login');
      
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header / Brand */}
        <View style={styles.header}>
          <Text style={styles.brand}>Partner with Tastifyy</Text>
          <Text style={styles.tagline}>
            Reach more customers and grow your business today.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Restaurant Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Tastifyy Pizzeria"
            placeholderTextColor="#aaa"
            value={restaurantName}
            onChangeText={setRestaurantName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            placeholder="+91 98765 43210"
            placeholderTextColor="#aaa"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Admin Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@restaurant.com"
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
              : <Text style={styles.primaryBtnText}>Create Partner Account</Text>
            }
          </TouchableOpacity>

          {/* Guest Browse */}
          <TouchableOpacity style={styles.ghostBtn} onPress={() => router.back()}>
            <Text style={styles.ghostBtnText}>← Back to Login</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By continuing, you agree to our Partner Terms of Service and Privacy Policy.
        </Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 36, marginTop: 20 },
  brand: { fontSize: 26, fontWeight: '900', color: '#171717', letterSpacing: -0.5, marginBottom: 6, textAlign: 'center' },
  tagline: { fontSize: 15, color: '#888', fontWeight: '500', textAlign: 'center' },

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
    paddingVertical: 16, alignItems: 'center', marginTop: 32,
    shadowColor: '#E86A22', shadowOpacity: 0.3,
    shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  ghostBtn: {
    marginTop: 16,
    paddingVertical: 14, alignItems: 'center',
  },
  ghostBtnText: { color: '#888', fontSize: 15, fontWeight: '600' },

  footer: { marginTop: 40, textAlign: 'center', fontSize: 11, color: '#BBB', lineHeight: 16 },
});
