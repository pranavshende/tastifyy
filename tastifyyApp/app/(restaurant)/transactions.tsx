import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import api from '../../api/axios';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '../../constants/theme';

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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={BrandColors.primary} /></View>;

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
            <View style={[styles.iconBox, { backgroundColor: BrandColors.secondaryLight }]}>
              <Ionicons name="trending-up" size={24} color={BrandColors.secondary} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.summaryValue}>₹{total_earnings.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={[styles.iconBox, { backgroundColor: BrandColors.background }]}>
              <Ionicons name="time" size={24} color={BrandColors.primary} />
            </View>
            <View>
              <Text style={styles.summaryLabel}>Pending Payout</Text>
              <Text style={styles.summaryValue}>₹{pending_payout.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={[styles.iconBox, { backgroundColor: BrandColors.backgroundMuted }]}>
              <Ionicons name="receipt" size={24} color={BrandColors.primary} />
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
            <Ionicons name="receipt-outline" size={48} color={BrandColors.border} style={{ marginBottom: 16 }} />
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
                    <View style={[styles.statusBadge, { backgroundColor: BrandColors.secondaryLight, borderColor: BrandColors.secondaryBorder }]}>
                      <Ionicons name="checkmark-circle" size={14} color={BrandColors.secondaryDark} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusText, { color: BrandColors.secondaryDark }]}>Paid</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: BrandColors.primaryLight, borderColor: BrandColors.primaryLight }]}>
                      <Ionicons name="time" size={14} color={BrandColors.primaryDark} style={{ marginRight: 4 }} />
                      <Text style={[styles.statusText, { color: BrandColors.primaryDark }]}>Pending</Text>
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
  container: { flex: 1, backgroundColor: BrandColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'red', fontSize: 16 },
  
  header: { padding: 24, paddingTop: 60, backgroundColor: BrandColors.surface, borderBottomWidth: 1, borderBottomColor: BrandColors.border },
  title: { fontSize: 28, fontWeight: '900', color: BrandColors.text },
  subtitle: { fontSize: 14, color: BrandColors.textMuted, marginTop: 4 },

  scroll: { padding: 16, paddingBottom: 40 },
  
  summaryContainer: { gap: 12, marginBottom: 24 },
  summaryCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: BrandColors.surface,
    padding: 16, 
    borderRadius: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: BrandColors.background
  },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  summaryLabel: { fontSize: 12, fontWeight: '700', color: BrandColors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 22, fontWeight: '900', color: BrandColors.text },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: BrandColors.text, marginBottom: 12 },
  
  empty: { backgroundColor: BrandColors.surface, padding: 32, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: BrandColors.border },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: BrandColors.text },
  emptyText: { fontSize: 14, color: BrandColors.textMuted, marginTop: 4 },

  list: { gap: 16 },
  txCard: {
    backgroundColor: BrandColors.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BrandColors.border
  },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  txId: { fontSize: 14, fontWeight: '700', color: BrandColors.textSecondary },
  txDate: { fontSize: 12, color: BrandColors.textMuted, fontWeight: '500' },
  
  txRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  txLabel: { fontSize: 14, color: BrandColors.textSecondary, fontWeight: '500' },
  txValue: { fontSize: 14, color: BrandColors.text, fontWeight: '700' },
  
  txDivider: { borderTopWidth: 1, borderTopColor: BrandColors.background, paddingTop: 12, marginTop: 4 },
  txLabelEarn: { fontSize: 15, color: BrandColors.text, fontWeight: '700' },
  txValueEarn: { fontSize: 16, color: BrandColors.primary, fontWeight: '900' },

  txStatusRow: { marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '800' }
});
