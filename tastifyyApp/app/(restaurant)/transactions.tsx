import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';

export default function RestaurantTransactions() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await api.get('/orders/restaurant/transactions');
        if (response.data.success) {
          setData(response.data.data);
        } else {
          Alert.alert('Error', 'Failed to fetch transactions');
        }
      } catch (err: any) {
        Alert.alert('Error', err.response?.data?.error?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#E86A22" /></View>;

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load data.</Text>
      </View>
    );
  }

  const { total_earnings, pending_payout, total_completed_orders, transactions } = data;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>Track your earnings and payment status</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.summaryValue}>₹{total_earnings.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="time" size={24} color="#E86A22" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Pending Payout</Text>
              <Text style={styles.summaryValue}>₹{pending_payout.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="receipt" size={24} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Completed Orders</Text>
              <Text style={styles.summaryValue}>{total_completed_orders}</Text>
            </View>
          </View>
        </View>

        {/* Transaction History */}
        <Text style={styles.sectionTitle}>Transaction History</Text>
        
        {transactions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color="#CCC" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyText}>Completed orders will appear here.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {transactions.map((tx: any) => (
              <View key={tx.id} style={styles.txCard}>
                <View style={styles.txHeader}>
                  <Text style={styles.txId}>Order #{tx.id.split('-')[0].toUpperCase()}</Text>
                  <Text style={styles.txDate}>
                    {new Date(tx.created_at).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.txRow}>
                  <Text style={styles.txLabel}>Customer</Text>
                  <Text style={styles.txValue}>{tx.customer_name || 'Guest'}</Text>
                </View>

                <View style={styles.txRow}>
                  <Text style={styles.txLabel}>Order Value</Text>
                  <Text style={styles.txValue}>₹{tx.total_amount.toFixed(2)}</Text>
                </View>

                <View style={[styles.txRow, styles.txDivider]}>
                  <Text style={styles.txLabelEarn}>Your Earnings</Text>
                  <Text style={styles.txValueEarn}>₹{tx.earnings.toFixed(2)}</Text>
                </View>
                
                <View style={styles.txStatusRow}>
                  {tx.is_paid_to_restaurant ? (
                    <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                      <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginRight: 4 }} />
                      <Text style={[styles.statusText, { color: '#059669' }]}>Paid</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: '#FEFCE8', borderColor: '#FEF08A' }]}>
                      <Ionicons name="time" size={14} color="#CA8A04" style={{ marginRight: 4 }} />
                      <Text style={[styles.statusText, { color: '#CA8A04' }]}>Pending</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', fontSize: 16 },
  
  header: { padding: 24, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 28, fontWeight: '900', color: '#171717' },
  subtitle: { fontSize: 14, color: '#888', marginTop: 4 },

  scroll: { padding: 16, paddingBottom: 40 },
  
  summaryContainer: { gap: 12, marginBottom: 24 },
  summaryCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#F5F5F5'
  },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 22, fontWeight: '900', color: '#171717' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#171717', marginBottom: 12 },
  
  empty: { backgroundColor: '#fff', padding: 32, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#EEE' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  emptyText: { fontSize: 14, color: '#888', marginTop: 4 },

  list: { gap: 16 },
  txCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  txId: { fontSize: 14, fontWeight: '700', color: '#666' },
  txDate: { fontSize: 12, color: '#999', fontWeight: '500' },
  
  txRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  txLabel: { fontSize: 14, color: '#555', fontWeight: '500' },
  txValue: { fontSize: 14, color: '#171717', fontWeight: '700' },
  
  txDivider: { borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 12, marginTop: 4 },
  txLabelEarn: { fontSize: 15, color: '#333', fontWeight: '700' },
  txValueEarn: { fontSize: 16, color: '#E86A22', fontWeight: '900' },

  txStatusRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '800' }
});
