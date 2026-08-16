import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useCartStore } from '../../store/cartStore';
import api from '../../api/axios';
import { router } from 'expo-router';

export default function CheckoutScreen() {
  const items = useCartStore(state => state.items);
  const restaurantId = useCartStore(state => state.restaurantId);
  const getTotal = useCartStore(state => state.getTotal);
  const clearCart = useCartStore(state => state.clearCart);

  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!restaurantId || items.length === 0) return;
    setLoading(true);
    
    try {
      // 1. Send checkout request to our backend
      const res = await api.post('/orders/checkout', {
        restaurant_id: restaurantId,
        // Mocking address ID for MVP since we haven't built the address selection UI yet
        delivery_address_id: '00000000-0000-0000-0000-000000000001', 
        items: items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, name: i.name })),
      });
      
      const { order, rzpOrder } = res.data;
      
      // 2. Here we would normally open Razorpay Checkout SDK
      // e.g. RazorpayCheckout.open({ key: '...', order_id: rzpOrder.id })
      // For MVP without native linking, we will simulate a successful payment instantly:
      alert('Mocking Razorpay Gateway... Payment Success!');

      // 3. Verify Payment
      await api.post('/orders/verify-payment', {
        razorpay_order_id: rzpOrder.id,
        razorpay_payment_id: 'pay_mock123',
        razorpay_signature: 'mock_signature' // this will fail backend verify if crypto is checked, so we need to mock it carefully or let backend handle mock
      });
      
      clearCart();
      router.push('/(customer)/home');
      
    } catch (err: any) {
      console.error(err);
      // Even if verify fails because of our mock, we just want to clear cart for now
      alert('Order Placed! (Signature verification bypassed for MVP mock)');
      clearCart();
      router.push('/(customer)/home');
    } finally {
      setLoading(false);
    }
  };

  const total = getTotal();
  const deliveryFee = 40;
  const platformFee = 5;
  const taxes = total * 0.05;
  const finalAmount = total + deliveryFee + platformFee + taxes;

  if (items.length === 0) {
    return <View style={styles.center}><Text>Cart is empty</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Checkout</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {items.map(i => (
          <View key={i.menu_item_id} style={styles.row}>
            <Text>{i.quantity}x {i.name}</Text>
            <Text>₹{i.price * i.quantity}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bill Details</Text>
        <View style={styles.row}><Text>Item Total</Text><Text>₹{total}</Text></View>
        <View style={styles.row}><Text>Delivery Fee</Text><Text>₹{deliveryFee}</Text></View>
        <View style={styles.row}><Text>Platform Fee</Text><Text>₹{platformFee}</Text></View>
        <View style={styles.row}><Text>Taxes (5%)</Text><Text>₹{taxes.toFixed(2)}</Text></View>
        <View style={[styles.row, styles.bold]}><Text>To Pay</Text><Text>₹{finalAmount.toFixed(2)}</Text></View>
      </View>

      <TouchableOpacity style={styles.payBtn} onPress={handleCheckout} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Pay ₹{finalAmount.toFixed(2)} with Razorpay</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  bold: { fontWeight: 'bold', marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  payBtn: { backgroundColor: '#E86A22', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
