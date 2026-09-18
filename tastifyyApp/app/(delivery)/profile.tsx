import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/axios';

export default function DeliveryProfile() {
  const { user, logout } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [profile, setProfile] = useState({
    name: '', phone: '', email: '', vehicle_type: '', vehicle_number: '', vehicle_model: '',
    bank_account_number: '', ifsc_code: '', upi_id: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/delivery/dashboard'), api.get('/delivery/profile')])
      .then(([dashboardRes, profileRes]) => {
        setStats(dashboardRes.data.data);
        const data = profileRes.data.data;
        setProfile({
          name: data.name || '', phone: data.phone || '', email: data.email || '',
          vehicle_type: data.vehicle_type || '', vehicle_number: data.vehicle_number || '', vehicle_model: data.vehicle_model || '',
          bank_account_number: data.bank_account_number || '', ifsc_code: data.ifsc_code || '', upi_id: data.upi_id || '',
        });
      })
      .catch(err => Alert.alert('Error', err.response?.data?.error?.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (key: keyof typeof profile, value: string) => {
    setProfile(current => ({ ...current, [key]: value }));
  };

  const saveProfile = async () => {
    if (!profile.name.trim() || !profile.phone.trim()) {
      Alert.alert('Missing Info', 'Name and phone are required.');
      return;
    }
    setSaving(true);
    try {
      await api.put('/delivery/profile', profile);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Rider Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{user?.name?.charAt(0) || 'R'}</Text></View>
          <Text style={styles.name}>{profile.name || user?.name}</Text>
          <Text style={styles.phone}>{profile.phone ? `+91 ${profile.phone}` : user?.phone}</Text>
          <View style={[styles.badge, stats?.status === 'approved' ? styles.badgeActive : styles.badgePending]}>
            <Text style={[styles.badgeText, stats?.status === 'approved' ? styles.badgeTextActive : styles.badgeTextPending]}>
              {stats?.status === 'approved' ? 'Verified Partner' : 'Verification Pending'}
            </Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Personal Details</Text>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={profile.name} onChangeText={value => updateField('name', value)} />
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={profile.phone} onChangeText={value => updateField('phone', value)} keyboardType="phone-pad" />
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={profile.email} onChangeText={value => updateField('email', value)} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.formTitle}>Vehicle Details</Text>
          <Text style={styles.label}>Vehicle Type</Text>
          <TextInput style={styles.input} value={profile.vehicle_type} onChangeText={value => updateField('vehicle_type', value)} placeholder="Bike / Scooter" />
          <Text style={styles.label}>Vehicle Number</Text>
          <TextInput style={styles.input} value={profile.vehicle_number} onChangeText={value => updateField('vehicle_number', value.toUpperCase())} autoCapitalize="characters" />
          <Text style={styles.label}>Vehicle Model</Text>
          <TextInput style={styles.input} value={profile.vehicle_model} onChangeText={value => updateField('vehicle_model', value)} placeholder="Honda Activa" />

          <Text style={styles.formTitle}>Payout Details</Text>
          <Text style={styles.label}>Bank Account Number</Text>
          <TextInput style={styles.input} value={profile.bank_account_number} onChangeText={value => updateField('bank_account_number', value)} keyboardType="number-pad" />
          <Text style={styles.label}>IFSC Code</Text>
          <TextInput style={styles.input} value={profile.ifsc_code} onChangeText={value => updateField('ifsc_code', value.toUpperCase())} autoCapitalize="characters" />
          <Text style={styles.label}>UPI ID</Text>
          <TextInput style={styles.input} value={profile.upi_id} onChangeText={value => updateField('upi_id', value)} autoCapitalize="none" placeholder="name@bank" />

          <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={saveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save Profile</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Today's Performance</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{stats?.today_deliveries || 0}</Text>
              <Text style={styles.statLbl}>Deliveries</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>₹{stats?.today_earnings || 0}</Text>
              <Text style={styles.statLbl}>Earnings</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 28, fontWeight: '900', color: '#171717' },
  
  content: { padding: 24 },
  
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#fff' },
  name: { fontSize: 24, fontWeight: '800', color: '#171717', marginBottom: 4 },
  phone: { fontSize: 16, color: '#888', marginBottom: 16 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeActive: { backgroundColor: '#ECFDF5' },
  badgePending: { backgroundColor: '#FFFBEB' },
  badgeText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  badgeTextActive: { color: '#10B981' },
  badgeTextPending: { color: '#F59E0B' },

  statsCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 32 },
  formCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2, marginBottom: 24 },
  formTitle: { fontSize: 17, fontWeight: '800', color: '#171717', marginTop: 4, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#555', marginTop: 10, marginBottom: 6 },
  input: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#171717' },
  saveBtn: { backgroundColor: '#E86A22', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.6 },
  statsTitle: { fontSize: 16, fontWeight: '800', color: '#171717', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { flex: 1, backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16, alignItems: 'center', marginHorizontal: 4 },
  statVal: { fontSize: 24, fontWeight: '900', color: '#E86A22', marginBottom: 4 },
  statLbl: { fontSize: 13, color: '#666', fontWeight: '600' },

  logoutBtn: { backgroundColor: '#FFEAE6', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  logoutText: { color: '#E83A22', fontSize: 16, fontWeight: '800' },
});
