import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useCartStore } from '../../store/cartStore';
import api from '../../api/axios';
import { router } from 'expo-router';
import RazorpayCheckout from 'react-native-razorpay';

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
      const res = await api.post('/orders', {
        restaurant_id: restaurantId,
        payment_method: 'card', // Forcing card to trigger razorpay for now
        items: items.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, name: i.name, price: i.price })),
      });
      
      if (res.data.success && res.data.data.razorpay_order_id) {
        const orderData = res.data.data;
        const options = {
          description: 'Food Order',
          currency: 'INR',
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_mock',
          amount: Math.round(orderData.total_amount * 100).toString(),
          name: 'Tastifyy',
          order_id: orderData.razorpay_order_id,
          theme: { color: '#E86A22' }
        };

        RazorpayCheckout.open(options).then(async (data: any) => {
          try {
            setLoading(true);
            const verifyRes = await api.post('/orders/verify-payment', {
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature
            });
            if (verifyRes.data.success) {
              clearCart();
              router.push('/(customer)/home');
            }
          } catch (verifyErr) {
            alert('Payment verification failed on server.');
          } finally {
            setLoading(false);
          }
        }).catch((error: any) => {
          alert(`Payment Failed: ${error.code} | ${error.description}`);
          setLoading(false);
        });
      } else {
        alert('Order placed successfully (COD)');
        clearCart();
        router.push('/(customer)/home');
        setLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      alert('Failed to place order.');
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
