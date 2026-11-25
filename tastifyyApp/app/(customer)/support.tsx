import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../api/axios';
import { Picker } from '@react-native-picker/picker';
import { BrandColors } from '../../constants/theme'; // Optional: if installed, else we can use a custom picker or standard TextInput

export default function CustomerSupport() {
  const { orderId } = useLocalSearchParams();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New ticket state
  const [category, setCategory] = useState('missing_item');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get('/support');
      setTickets(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please provide a description.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/support', {
        order_id: orderId || null,
        category,
        description
      });
      Alert.alert('Success', 'Support ticket created. We will get back to you shortly.');
      setCategory('missing_item');
      setDescription('');
      fetchTickets();
      if (orderId) {
        router.back();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error?.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Support</Text>
        <Text style={styles.subtitle}>{orderId ? `Issue with Order #${String(orderId).slice(-6)}` : 'How can we help you?'}</Text>
      </View>

      <FlatList
        data={tickets}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Create a Ticket</Text>
            
            <Text style={styles.label}>Category</Text>
            {/* MVP Simple selection without installing external picker */}
            <View style={styles.categoryRow}>
              {['missing_item', 'payment_issue', 'delivery_issue'].map(cat => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.catBtn, category === cat && styles.catBtnActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catText, category === cat && styles.catTextActive]}>
                    {cat.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Please describe the issue..."
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color={BrandColors.surface} /> : <Text style={styles.submitBtnText}>Submit Ticket</Text>}
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketCategory}>{item.category.replace('_', ' ').toUpperCase()}</Text>
              <View style={[styles.badge, item.status === 'resolved' ? styles.badgeResolved : styles.badgeOpen]}>
                <Text style={[styles.badgeText, item.status === 'resolved' ? styles.textResolved : styles.textOpen]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.ticketDesc}>{item.description}</Text>
            {item.status === 'resolved' && item.resolution_notes && (
              <View style={styles.resolutionBox}>
                <Text style={styles.resolutionTitle}>Resolution:</Text>
                <Text style={styles.resolutionText}>{item.resolution_notes}</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BrandColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: BrandColors.surface, borderBottomWidth: 1, borderBottomColor: BrandColors.border },
  title: { fontSize: 28, fontWeight: '900', color: BrandColors.text },
  subtitle: { fontSize: 14, color: BrandColors.textMuted, marginTop: 4 },
  
  list: { padding: 16 },

  formCard: { backgroundColor: BrandColors.surface, borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  formTitle: { fontSize: 18, fontWeight: '900', color: BrandColors.text, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: BrandColors.textSecondary, marginBottom: 8, marginTop: 12 },
  
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { borderWidth: 1, borderColor: BrandColors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginBottom: 8 },
  catBtnActive: { backgroundColor: BrandColors.primary, borderColor: BrandColors.primary },
  catText: { fontSize: 12, fontWeight: '600', color: BrandColors.textMuted, textTransform: 'capitalize' },
  catTextActive: { color: BrandColors.surface },

  input: { borderWidth: 1, borderColor: BrandColors.border, borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', backgroundColor: BrandColors.background, marginBottom: 20 },
  submitBtn: { backgroundColor: BrandColors.text, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: BrandColors.surface, fontSize: 16, fontWeight: '800' },

  ticketCard: { backgroundColor: BrandColors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: BrandColors.border },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ticketCategory: { fontSize: 12, fontWeight: '800', color: BrandColors.textMuted },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeOpen: { backgroundColor: BrandColors.primaryLight },
  badgeResolved: { backgroundColor: BrandColors.secondaryLight },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  textOpen: { color: BrandColors.primaryDark },
  textResolved: { color: BrandColors.secondaryDark },
  ticketDesc: { fontSize: 15, color: BrandColors.text, lineHeight: 22 },
  
  resolutionBox: { marginTop: 12, backgroundColor: BrandColors.background, padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: BrandColors.secondary },
  resolutionTitle: { fontSize: 12, fontWeight: '800', color: BrandColors.secondary, marginBottom: 4 },
  resolutionText: { fontSize: 14, color: BrandColors.textSecondary },
});
