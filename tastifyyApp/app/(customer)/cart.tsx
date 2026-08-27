import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import api from '../../api/axios';
import { useCartStore } from '../../store/cartStore';
import RazorpayCheckout from 'react-native-razorpay';

export default function CartScreen() {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('card');
  
  const cartItems = useCartStore(state => state.items);
  const restaurantId = useCartStore(state => state.restaurantId);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const clearCart = useCartStore(state => state.clearCart);
  
  const itemTotal = useCartStore(state => state.getTotal());
  const deliveryFee = 40;
  const platformFee = 10;
  const taxAmount = itemTotal * 0.05;
  const finalTotal = itemTotal + deliveryFee + platformFee + taxAmount;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        restaurant_id: restaurantId,
        items: cartItems.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, name: i.name, price: i.price })),
        payment_method: paymentMethod
      });
      
      if (res.data.success) {
        if (paymentMethod === 'cod') {
          clearCart();
          Alert.alert('Success!', 'Your order has been placed successfully.', [
            { text: 'Track Order', onPress: () => router.replace('/(customer)/orders') }
          ]);
          setLoading(false);
        } else if (res.data.data.razorpay_order_id) {
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
                Alert.alert('Success!', 'Payment verified and order placed.', [
                  { text: 'Track Order', onPress: () => router.replace('/(customer)/orders') }
                ]);
              }
            } catch (verifyErr) {
              Alert.alert('Payment Error', 'Payment verification failed on server.');
            } finally {
              setLoading(false);
            }
          }).catch((error: any) => {
            Alert.alert('Payment Failed', `${error.code} | ${error.description}`);
            setLoading(false);
          });
        }
      }
    } catch (error: any) {
      if (error.response?.data?.error?.code === 'NO_ADDRESS') {
        Alert.alert('Address Required', 'Please set a delivery address in your profile.');
      } else {
        Alert.alert('Order Failed', error.response?.data?.error?.message || 'Something went wrong. Please try again.');
      }
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.emptyIconWrap}><Text style={styles.emptyIcon}>🛒</Text></View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Looks like you haven't added anything yet.</Text>
        <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/(customer)/home')}>
          <Text style={styles.browseText}>Browse Restaurants</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Cart</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.itemsCard}>
          {cartItems.map((item, index) => (
            <View key={item.menu_item_id} style={[styles.itemRow, index > 0 && styles.itemBorder]}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{item.price.toFixed(2)}</Text>
              </View>
              <View style={styles.qtyControl}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.menu_item_id, -1)}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.menu_item_id, 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>
          
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{itemTotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{deliveryFee.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Platform Fee</Text>
            <Text style={styles.billValue}>₹{platformFee.toFixed(2)}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes (5%)</Text>
            <Text style={styles.billValue}>₹{taxAmount.toFixed(2)}</Text>
          </View>

          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <Text style={styles.billTitle}>Payment Method</Text>
          <TouchableOpacity 
            style={[styles.codRow, paymentMethod === 'card' && styles.radioSelected]} 
            onPress={() => setPaymentMethod('card')}
          >
            <Text style={styles.codText}>💳 Pay Online (Razorpay)</Text>
            <View style={[styles.radioActive, paymentMethod !== 'card' && styles.radioInactive]}>
              {paymentMethod === 'card' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
          <View style={{ height: 12 }} />
          <TouchableOpacity 
            style={[styles.codRow, paymentMethod === 'cod' && styles.radioSelected]} 
            onPress={() => setPaymentMethod('cod')}
          >
            <Text style={styles.codText}>💵 Cash on Delivery (COD)</Text>
            <View style={[styles.radioActive, paymentMethod !== 'cod' && styles.radioInactive]}>
              {paymentMethod === 'cod' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.checkoutBtn, loading && styles.disabledBtn]} 
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <View>
                <Text style={styles.checkoutTotal}>₹{finalTotal.toFixed(2)}</Text>
                <Text style={styles.checkoutSub}>TOTAL</Text>
              </View>
              <Text style={styles.checkoutText}>Place Order →</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F5' },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  emptyIconWrap: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFEAE6', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyIcon: { fontSize: 50 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#171717', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#888', marginBottom: 32 },
  browseBtn: { backgroundColor: '#E86A22', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16 },
  browseText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  header: { backgroundColor: '#fff', padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 16 },
  backText: { color: '#E86A22', fontSize: 16, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '900', color: '#171717' },

  scroll: { padding: 16, paddingBottom: 120 },
  
  itemsCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  itemBorder: { borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  itemInfo: { flex: 1, paddingRight: 16 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#171717', marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#E86A22' },
  
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF5E6', borderRadius: 8, borderWidth: 1, borderColor: '#FFEAE6' },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  qtyBtnText: { color: '#E86A22', fontSize: 16, fontWeight: '900' },
  qtyText: { color: '#171717', fontSize: 14, fontWeight: '800', paddingHorizontal: 4 },

  billCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  billTitle: { fontSize: 16, fontWeight: '800', color: '#171717', marginBottom: 16 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  billLabel: { fontSize: 14, color: '#666', fontWeight: '500' },
  billValue: { fontSize: 14, color: '#171717', fontWeight: '700' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 8, paddingTop: 16, marginBottom: 0 },
  totalLabel: { fontSize: 16, color: '#171717', fontWeight: '900' },
  totalValue: { fontSize: 18, color: '#E86A22', fontWeight: '900' },

  paymentCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  codRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F9F9', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#F0F0F0' },
  radioSelected: { borderColor: '#E86A22', backgroundColor: '#FFF5E6' },
  codText: { fontSize: 15, fontWeight: '700', color: '#171717' },
  radioActive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E86A22', alignItems: 'center', justifyContent: 'center' },
  radioInactive: { borderColor: '#ccc' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E86A22' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 },
  checkoutBtn: { backgroundColor: '#E86A22', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  disabledBtn: { opacity: 0.7 },
  checkoutTotal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  checkoutSub: { color: '#FFD8C4', fontSize: 10, fontWeight: '800' },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
