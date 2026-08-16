import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';

const ROLES = [
  { id: 'customer', label: 'Customer' },
  { id: 'delivery_partner', label: 'Delivery Partner' },
  { id: 'restaurant_partner', label: 'Restaurant Partner' },
  { id: 'admin', label: 'Admin' }
];

export default function SuperLoginScreen() {
  const [role, setRole] = useState('customer');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { phone, role });
      setStep('VERIFY');
    } catch (err) {
      alert('Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { phone, role, otp });
      await AsyncStorage.setItem('token', res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      
      if (res.data.user.role === 'customer') {
        router.replace('/(customer)/home');
      } else if (res.data.user.role === 'delivery_partner') {
        router.replace('/(delivery)/home');
      } else {
        router.replace('/web-portal');
      }
    } catch (err) {
      alert('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tastifyy</Text>
      <Text style={styles.subtitle}>Super Login</Text>

      {step === 'REQUEST' ? (
        <>
          <Text style={styles.label}>Select your role:</Text>
          <View style={styles.roleContainer}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={[styles.roleButton, role === r.id && styles.roleButtonActive]}
                onPress={() => setRole(r.id)}
              >
                <Text style={[styles.roleText, role === r.id && styles.roleTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Phone Number (e.g. 9876543210)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TouchableOpacity style={styles.button} onPress={requestOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP (mock: 123456)"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
          />
          <TouchableOpacity style={styles.button} onPress={verifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#E86A22', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 18, color: '#666', textAlign: 'center', marginBottom: 30 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#333' },
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  roleButton: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#f9f9f9' },
  roleButtonActive: { borderColor: '#E86A22', backgroundColor: '#E86A22' },
  roleText: { color: '#666', fontWeight: '500' },
  roleTextActive: { color: '#fff', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#E86A22', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
