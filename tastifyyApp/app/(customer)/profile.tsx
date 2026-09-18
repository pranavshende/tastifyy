import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, ActivityIndicator, StatusBar, ImageBackground } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { router } from 'expo-router';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Home', address_line: '', city: '', state: '', pincode: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/customer/addresses');
      setAddresses(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert('Delete Address', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await api.delete(`/customer/addresses/${id}`);
          fetchAddresses();
        } catch (err) {
          Alert.alert('Error', 'Failed to delete address');
        }
      }}
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/customer/addresses/${id}/default`);
      fetchAddresses();
    } catch (err) {
      Alert.alert('Error', 'Failed to set default address');
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.address_line || !newAddress.city || !newAddress.pincode) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/customer/addresses', newAddress);
      setIsModalVisible(false);
      setNewAddress({ label: 'Home', address_line: '', city: '', state: '', pincode: '' });
      fetchAddresses();
    } catch (err) {
      Alert.alert('Error', 'Failed to add address');
    } finally {
      setSubmitting(false);
    }
  };

  const renderSettingOption = (icon: any, title: string, subtitle?: string, onPress?: () => void) => (
    <TouchableOpacity style={styles.settingRow} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.settingIconWrap}>
        <Ionicons name={icon} size={22} color="#555" />
      </View>
      <View style={styles.settingTextWrap}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSub}>{subtitle}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#171717" translucent={false} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <ImageBackground 
          source={{ uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop' }}
          style={styles.headerBg}
        >
          <View style={styles.headerOverlay} />
          
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfoWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
            <View style={styles.headerInfoText}>
              <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
              <Text style={styles.email}>{user?.email || user?.phone || 'Login to view profile'}</Text>
            </View>
            <TouchableOpacity style={styles.editBtn}>
              <Ionicons name="pencil" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Quick Links */}
        <View style={styles.quickLinksCard}>
          <TouchableOpacity style={styles.quickLinkItem} onPress={() => router.push('/(customer)/orders')}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#FFF5E6' }]}>
              <Ionicons name="receipt" size={24} color="#E86A22" />
            </View>
            <Text style={styles.quickLinkText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLinkItem}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="heart" size={24} color="#DB2777" />
            </View>
            <Text style={styles.quickLinkText}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickLinkItem}>
            <View style={[styles.quickLinkIcon, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="wallet" size={24} color="#059669" />
            </View>
            <Text style={styles.quickLinkText}>Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Addresses Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Saved Addresses</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.addBtnWrap}>
              <Ionicons name="add" size={16} color="#E86A22" />
              <Text style={styles.addBtnText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#E86A22" style={{ marginVertical: 20 }} />
          ) : addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={40} color="#CCC" />
              <Text style={styles.emptyText}>No saved addresses found.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressScroll}>
              {addresses.map((address) => (
                <View key={address.id} style={[styles.addressCard, address.is_default && styles.addressCardDefault]}>
                  <View style={styles.addressHeaderRow}>
                    <View style={styles.labelWrap}>
                      <Ionicons 
                        name={address.label.toLowerCase() === 'home' ? 'home' : address.label.toLowerCase() === 'work' ? 'briefcase' : 'location'} 
                        size={18} 
                        color={address.is_default ? '#E86A22' : '#555'} 
                      />
                      <Text style={[styles.addressLabel, address.is_default && { color: '#E86A22' }]}>{address.label}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteAddress(address.id)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={18} color="#FF4444" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.addressLine} numberOfLines={2}>{address.address_line}</Text>
                  <Text style={styles.addressCity}>{address.city}, {address.state} {address.pincode}</Text>
                  
                  <View style={styles.addressFooter}>
                    {address.is_default ? (
                      <View style={styles.defaultBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#E86A22" style={{ marginRight: 4 }} />
                        <Text style={styles.defaultBadgeText}>Default Address</Text>
                      </View>
                    ) : (
                      <TouchableOpacity style={styles.setDefaultBtn} onPress={() => handleSetDefault(address.id)}>
                        <Text style={styles.setDefaultText}>Set as Default</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Settings / Other */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          {renderSettingOption('person-outline', 'Edit Profile', 'Update your name and contact details')}
          {renderSettingOption('notifications-outline', 'Notifications', 'Manage your notification preferences')}
          {renderSettingOption('shield-checkmark-outline', 'Privacy & Security', 'Password and security settings')}
          {renderSettingOption('help-buoy-outline', 'Help & Support', 'Get help with your past orders')}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Address Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Delivery Address</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeModalBtn}>
                <Ionicons name="close" size={24} color="#171717" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Label (Home, Work, etc.)</Text>
              <TextInput 
                style={styles.input} 
                value={newAddress.label}
                onChangeText={text => setNewAddress({...newAddress, label: text})}
                placeholder="e.g. Home"
              />

              <Text style={styles.inputLabel}>Address Line *</Text>
              <TextInput 
                style={[styles.input, { height: 80 }]} 
                value={newAddress.address_line}
                onChangeText={text => setNewAddress({...newAddress, address_line: text})}
                placeholder="House No, Building, Street"
                multiline
                textAlignVertical="top"
              />

              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>City *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={newAddress.city}
                    onChangeText={text => setNewAddress({...newAddress, city: text})}
                    placeholder="City"
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.inputLabel}>Pincode *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={newAddress.pincode}
                    onChangeText={text => setNewAddress({...newAddress, pincode: text})}
                    placeholder="Pincode"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>State</Text>
              <TextInput 
                style={styles.input} 
                value={newAddress.state}
                onChangeText={text => setNewAddress({...newAddress, state: text})}
                placeholder="State"
              />

              <TouchableOpacity 
                style={[styles.saveBtn, submitting && { opacity: 0.7 }]} 
                onPress={handleAddAddress}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Address</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { flexGrow: 1 },
  
  headerBg: { width: '100%', paddingTop: 20, paddingBottom: 30, overflow: 'hidden', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.65)' },
  headerTop: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  
  profileInfoWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E86A22', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff', shadowColor: '#E86A22', shadowOpacity: 0.5, shadowRadius: 10, elevation: 8, marginRight: 16 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  headerInfoText: { flex: 1 },
  name: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  editBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  quickLinksCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 20, marginTop: -20, borderRadius: 20, padding: 20, justifyContent: 'space-around', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 5 },
  quickLinkItem: { alignItems: 'center' },
  quickLinkIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLinkText: { fontSize: 13, fontWeight: '700', color: '#555' },

  section: { backgroundColor: '#fff', marginTop: 20, paddingVertical: 24, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#171717' },
  addBtnWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFF5E6', borderRadius: 8 },
  addBtnText: { color: '#E86A22', fontWeight: '800', fontSize: 13, marginLeft: 4 },

  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 15, marginTop: 12, fontWeight: '500' },

  addressScroll: { paddingHorizontal: 20, paddingBottom: 10 },
  addressCard: { width: 260, borderWidth: 1, borderColor: '#F0F0F0', borderRadius: 16, padding: 16, marginRight: 16, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  addressCardDefault: { borderColor: '#E86A22', backgroundColor: '#FFFDF9' },
  addressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  labelWrap: { flexDirection: 'row', alignItems: 'center' },
  addressLabel: { fontSize: 15, fontWeight: '800', color: '#171717', marginLeft: 8 },
  deleteBtn: { padding: 4 },
  addressLine: { fontSize: 14, color: '#444', marginBottom: 4, lineHeight: 22, fontWeight: '500' },
  addressCity: { fontSize: 13, color: '#888', marginBottom: 16 },
  addressFooter: { borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 12, marginTop: 'auto' },
  setDefaultBtn: { alignSelf: 'flex-start' },
  setDefaultText: { color: '#888', fontSize: 13, fontWeight: '700' },
  defaultBadge: { flexDirection: 'row', alignItems: 'center' },
  defaultBadgeText: { color: '#E86A22', fontSize: 13, fontWeight: '800' },

  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  settingIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9F9F9', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  settingTextWrap: { flex: 1 },
  settingTitle: { fontSize: 16, fontWeight: '700', color: '#171717', marginBottom: 2 },
  settingSub: { fontSize: 13, color: '#888' },

  logoutBtn: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', 
    backgroundColor: '#fff', marginHorizontal: 20, marginTop: 24, padding: 16, borderRadius: 16,
    borderWidth: 1, borderColor: '#FFE5E5'
  },
  logoutText: { color: '#FF4444', fontSize: 16, fontWeight: '800', marginLeft: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#171717' },
  closeModalBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#555', marginBottom: 8 },
  input: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 16, padding: 16, fontSize: 15, marginBottom: 16, color: '#171717', fontWeight: '500' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  saveBtn: { backgroundColor: '#E86A22', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 16, marginBottom: 20, shadowColor: '#E86A22', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '900' }
});
