import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch } from 'react-native';
import { router } from 'expo-router';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function RestaurantOnboarding() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    type: 'restaurant',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    service_radius_km: '5',
    avg_preparation_time_mins: '30',
    is_pure_veg: false,
    description: '',
  });

  const handleChange = (key: string, value: string | boolean) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleNext = async () => {
    if (!formData.name) {
      Alert.alert('Missing Info', 'Restaurant name is required.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/onboarding/restaurant', { 
        ...formData, 
        service_radius_km: parseInt(formData.service_radius_km) || 5,
        avg_preparation_time_mins: parseInt(formData.avg_preparation_time_mins) || 30,
        onboarding_step: step + 1 
      });
      setStep(step + 1);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to save progress');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.address_line || !formData.city || !formData.state || !formData.pincode) {
      Alert.alert('Missing Info', 'Please enter complete address.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/onboarding/restaurant', { 
        ...formData, 
        service_radius_km: parseInt(formData.service_radius_km) || 5,
        avg_preparation_time_mins: parseInt(formData.avg_preparation_time_mins) || 30,
        onboarding_step: 'complete' 
      });
      await api.post('/onboarding/restaurant/submit');
      router.replace('/onboarding/status');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Partner Onboarding</Text>
          <Text style={styles.subtitle}>Step {step} of 2</Text>
        </View>
        <View style={styles.iconWrap}><Text style={styles.icon}>🏪</Text></View>
      </View>

      {step === 1 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <Text style={styles.label}>Restaurant Name</Text>
          <TextInput
            style={styles.input}
            placeholder="The Spice Grill"
            value={formData.name}
            onChangeText={(val) => handleChange('name', val)}
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Tell us about your restaurant..."
            multiline
            value={formData.description}
            onChangeText={(val) => handleChange('description', val)}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Pure Vegetarian</Text>
            <Switch
              value={formData.is_pure_veg}
              onValueChange={(val) => handleChange('is_pure_veg', val)}
              trackColor={{ false: '#ddd', true: '#E86A22' }}
            />
          </View>

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleNext} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Next Step →</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Operations</Text>

          <Text style={styles.label}>Street Address</Text>
          <TextInput
            style={styles.input}
            placeholder="123 Main St"
            value={formData.address_line}
            onChangeText={(val) => handleChange('address_line', val)}
          />

          <View style={styles.row}>
            <View style={styles.third}><Text style={styles.label}>City</Text><TextInput style={styles.input} value={formData.city} onChangeText={(val) => handleChange('city', val)} /></View>
            <View style={styles.third}><Text style={styles.label}>State</Text><TextInput style={styles.input} value={formData.state} onChangeText={(val) => handleChange('state', val)} /></View>
            <View style={styles.third}><Text style={styles.label}>Pincode</Text><TextInput style={styles.input} value={formData.pincode} onChangeText={(val) => handleChange('pincode', val)} keyboardType="number-pad" /></View>
          </View>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>Delivery Radius (km)</Text>
              <TextInput style={styles.input} value={formData.service_radius_km} onChangeText={(val) => handleChange('service_radius_km', val)} keyboardType="number-pad" />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Prep Time (mins)</Text>
              <TextInput style={styles.input} value={formData.avg_preparation_time_mins} onChangeText={(val) => handleChange('avg_preparation_time_mins', val)} keyboardType="number-pad" />
            </View>
          </View>

          <View style={[styles.row, { marginTop: 12 }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, loading && styles.btnDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Application</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '900', color: '#171717' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 4 },
  iconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#E86A2220', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 28 },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#171717', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F9F9F9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#171717', borderWidth: 1, borderColor: '#EEE' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  third: { width: '31%' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12, backgroundColor: '#F9F9F9', padding: 12, borderRadius: 12 },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#171717' },
  btn: { backgroundColor: '#E86A22', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24, shadowColor: '#E86A22', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { width: '30%', backgroundColor: '#F0F0F0', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  backBtnText: { color: '#555', fontSize: 15, fontWeight: '700' },
  submitBtn: { width: '65%', backgroundColor: '#E86A22', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#E86A22', shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
});
