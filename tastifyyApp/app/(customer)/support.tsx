import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../../api/axios';
import { Picker } from '@react-native-picker/picker'; // Optional: if installed, else we can use a custom picker or standard TextInput

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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;

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
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Ticket</Text>}
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
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 28, fontWeight: '900', color: '#171717' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  
  list: { padding: 16 },

  formCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  formTitle: { fontSize: 18, fontWeight: '900', color: '#171717', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: '#555', marginBottom: 8, marginTop: 12 },
  
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginBottom: 8 },
  catBtnActive: { backgroundColor: '#E86A22', borderColor: '#E86A22' },
  catText: { fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'capitalize' },
  catTextActive: { color: '#fff' },

  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, height: 100, textAlignVertical: 'top', backgroundColor: '#F9FAFB', marginBottom: 20 },
  submitBtn: { backgroundColor: '#171717', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  ticketCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ticketCategory: { fontSize: 12, fontWeight: '800', color: '#888' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeOpen: { backgroundColor: '#FEF3C7' },
  badgeResolved: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  textOpen: { color: '#D97706' },
  textResolved: { color: '#059669' },
  ticketDesc: { fontSize: 15, color: '#333', lineHeight: 22 },
  
  resolutionBox: { marginTop: 12, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#10B981' },
  resolutionTitle: { fontSize: 12, fontWeight: '800', color: '#10B981', marginBottom: 4 },
  resolutionText: { fontSize: 14, color: '#4B5563' },
});
