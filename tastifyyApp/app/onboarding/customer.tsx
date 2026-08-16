import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function CustomerOnboarding() {
  const { user, initAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dob: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSubmit = async () => {
    if (!formData.address_line || !formData.city || !formData.state || !formData.pincode) {
      Alert.alert('Missing Info', 'Please enter your complete delivery address.');
      return;
    }

    setLoading(true);
    try {
      await api.patch('/onboarding/customer', {
        dob: formData.dob,
        address: {
          label: 'home',
          address_line: formData.address_line,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          latitude: 0,
          longitude: 0,
        }
      });
      await initAuth(); // Refresh user profile
      router.replace('/(customer)/home');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Welcome to Tastifyy, {user?.name}!</Text>
      <Text style={styles.subtitle}>Let's set up your profile so we can find the best food near you.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Date of Birth (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={formData.dob}
          onChangeText={(val) => handleChange('dob', val)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        
        <Text style={styles.label}>Street Address</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 123 Main St, Apt 4B"
          value={formData.address_line}
          onChangeText={(val) => handleChange('address_line', val)}
        />

        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="Mumbai"
              value={formData.city}
              onChangeText={(val) => handleChange('city', val)}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              placeholder="Maharashtra"
              value={formData.state}
              onChangeText={(val) => handleChange('state', val)}
            />
          </View>
        </View>

        <Text style={styles.label}>Pincode</Text>
        <TextInput
          style={styles.input}
          placeholder="400001"
          keyboardType="number-pad"
          value={formData.pincode}
          onChangeText={(val) => handleChange('pincode', val)}
        />
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Complete Setup</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '900', color: '#171717', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 32 },
  section: { marginBottom: 24, backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#171717', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#F9F9F9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: '#171717', borderWidth: 1, borderColor: '#EEE',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  btn: {
    backgroundColor: '#E86A22', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12,
    shadowColor: '#E86A22', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
