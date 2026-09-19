import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import api from '../../api/axios';

export default function DeliveryOnboarding() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    vehicle_type: 'bike',
    vehicle_number: '',
    vehicle_model: '',
    license_number: '',
    bank_account_number: '',
    ifsc_code: '',
    upi_id: '',
    availability_type: 'full_time',
  });

  const handleChange = (key: string, value: string) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleNext = async () => {
    if (!formData.vehicle_number || !formData.license_number) {
      Alert.alert('Missing Info', 'Vehicle and License details are required.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/onboarding/delivery', { ...formData, onboarding_step: step + 1 });
      setStep(step + 1);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to save progress');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.bank_account_number || !formData.ifsc_code) {
      Alert.alert('Missing Info', 'Bank details are required for payouts.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/onboarding/delivery', { ...formData, onboarding_step: 'complete' });
      await api.post('/onboarding/delivery/submit');
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
        <View style={styles.iconWrap}><Text style={styles.icon}>🛵</Text></View>
      </View>

      {step === 1 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle & License Details</Text>

          <Text style={styles.label}>Vehicle Type</Text>
          <View style={styles.tabs}>
            {['bike', 'scooter', 'bicycle'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.tab, formData.vehicle_type === type && styles.tabActive]}
                onPress={() => handleChange('vehicle_type', type)}
              >
                <Text style={[styles.tabText, formData.vehicle_type === type && styles.tabTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.label}>Vehicle Model</Text>
          <TextInput
            style={styles.input}
            placeholder="Honda Activa"
            value={formData.vehicle_model}
            onChangeText={(val) => handleChange('vehicle_model', val)}
          />

          <Text style={styles.label}>Vehicle Number</Text>
          <TextInput
            style={styles.input}
            placeholder="MH 12 AB 1234"
            autoCapitalize="characters"
            value={formData.vehicle_number}
            onChangeText={(val) => handleChange('vehicle_number', val)}
          />

          <Text style={styles.label}>Driving License No.</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter DL Number"
            autoCapitalize="characters"
            value={formData.license_number}
            onChangeText={(val) => handleChange('license_number', val)}
          />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleNext} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Next Step →</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout & Preferences</Text>

          <Text style={styles.label}>Work Type</Text>
          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, formData.availability_type === 'full_time' && styles.tabActive]} onPress={() => handleChange('availability_type', 'full_time')}>
              <Text style={[styles.tabText, formData.availability_type === 'full_time' && styles.tabTextActive]}>Full-Time</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, formData.availability_type === 'part_time' && styles.tabActive]} onPress={() => handleChange('availability_type', 'part_time')}>
              <Text style={[styles.tabText, formData.availability_type === 'part_time' && styles.tabTextActive]}>Part-Time</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Bank Account Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Account Number"
            keyboardType="number-pad"
            value={formData.bank_account_number}
            onChangeText={(val) => handleChange('bank_account_number', val)}
          />

          <Text style={styles.label}>IFSC Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Bank IFSC Code"
            autoCapitalize="characters"
            value={formData.ifsc_code}
            onChangeText={(val) => handleChange('ifsc_code', val)}
          />

          <Text style={styles.label}>UPI ID (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="name@bank"
            autoCapitalize="none"
            value={formData.upi_id}
            onChangeText={(val) => handleChange('upi_id', val)}
          />

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
  iconWrap: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#22A3E820', alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 28 },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#171717', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F9F9F9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#171717', borderWidth: 1, borderColor: '#EEE' },
  tabs: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 12, padding: 4, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#E86A22', fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  btn: { backgroundColor: '#E86A22', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24, shadowColor: '#E86A22', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { width: '30%', backgroundColor: '#F0F0F0', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  backBtnText: { color: '#555', fontSize: 15, fontWeight: '700' },
  submitBtn: { width: '65%', backgroundColor: '#E86A22', borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: '#E86A22', shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
});
