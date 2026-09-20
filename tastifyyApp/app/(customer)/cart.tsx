import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../api/axios';
import { useCartStore } from '../../store/cartStore';
import RazorpayCheckout from 'react-native-razorpay';
import { RAZORPAY_KEY_ID } from '../../constants/config';

export default function CartScreen() {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [launchSettings, setLaunchSettings] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  const cartItems = useCartStore(state => state.items);
  const restaurantId = useCartStore(state => state.restaurantId);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const clearCart = useCartStore(state => state.clearCart);
  
  const itemTotal = useCartStore(state => state.getTotal());
  const deliveryFee = launchSettings?.freeDeliveryEnabled === false ? 20 : 0;
  const platformFee = 5;
  const taxAmount = itemTotal * 0.02;
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);

  const finalTotal = itemTotal + deliveryFee + platformFee + taxAmount - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setApplyingCoupon(true);
    setCouponError('');
    try {
      const res = await api.post('/orders/apply-coupon', {
        code: couponCode,
        total_amount: itemTotal
      });
      if (res.data.success) {
        setDiscountAmount(res.data.data.discount_amount);
        setAppliedCouponCode(res.data.data.code);
        Alert.alert('Success', `Coupon applied! You saved ₹${res.data.data.discount_amount.toFixed(2)}`);
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.error?.message || 'Invalid coupon');
      setDiscountAmount(0);
      setAppliedCouponCode(null);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setAppliedCouponCode(null);
    setDiscountAmount(0);
    setCouponError('');
  };

  useEffect(() => {
    api.get('/orders/checkout-config').then(res => setLaunchSettings(res.data.data)).catch(() => undefined);
    const fetchAddresses = async () => {
      try {
        const res = await api.get('/customer/addresses');
        const data = res.data.data || [];
        setAddresses(data);
        const defaultAddr = data.find((a: any) => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (data.length > 0) {
          setSelectedAddressId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch addresses', err);
      }
    };
    fetchAddresses();
  }, []);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (!selectedAddressId) {
      Alert.alert('Address Required', 'Please set a delivery address in your profile.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/orders', {
        restaurant_id: restaurantId,
        items: cartItems.map(i => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, name: i.name, price: i.price })),
        payment_method: paymentMethod,
        delivery_address_id: selectedAddressId,
        confirm_address: true,
        coupon_code: appliedCouponCode
      });
      
      if (res.data.success) {
        if (paymentMethod === 'cod') {
          clearCart();
          Alert.alert('Order Placed', 'Your order has been placed successfully.', [
            { text: 'View Orders', onPress: () => router.replace('/(customer)/orders') }
          ]);
        } else if (res.data.data.razorpay_order_id) {
          const orderData = res.data.data;
          const options = {
            description: 'Food Order',
            currency: 'INR',
            key: RAZORPAY_KEY_ID,
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
                Alert.alert('Order Placed', 'Your payment was successful and your order is confirmed.', [
                  { text: 'View Orders', onPress: () => router.replace('/(customer)/orders') }
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
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <View style={styles.emptyIconWrap}>
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png' }} style={styles.emptyIconImage} />
        </View>
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
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#171717" />
        </TouchableOpacity>
        <Text style={styles.title}>Review Order</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.addressCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="location" size={20} color="#E86A22" />
            <Text style={styles.billTitle}>Delivery Address</Text>
          </View>
          {selectedAddressId ? (
            <View style={styles.addressBox}>
              <View style={styles.addressTextWrap}>
                <Text style={styles.addressText} numberOfLines={2}>
                  {addresses.find(a => a.id === selectedAddressId)?.address_line}, 
                  {addresses.find(a => a.id === selectedAddressId)?.city}
                </Text>
              </View>
              <TouchableOpacity style={styles.changeAddressBtnWrap} onPress={() => router.push('/(customer)/profile')}>
                <Text style={styles.changeAddressBtn}>CHANGE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addAddressBtn} onPress={() => router.push('/(customer)/profile')}>
              <Ionicons name="add-circle-outline" size={20} color="#E86A22" style={{ marginRight: 8 }} />
              <Text style={styles.addAddressBtnText}>Add Delivery Address</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.itemsCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="restaurant" size={20} color="#171717" />
            <Text style={styles.billTitle}>Order Summary</Text>
          </View>
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
          <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.back()}>
            <Ionicons name="add" size={16} color="#E86A22" />
            <Text style={styles.addMoreText}>Add more items</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.couponCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="pricetag" size={20} color="#171717" />
            <Text style={styles.billTitle}>Offers & Benefits</Text>
          </View>
          {appliedCouponCode ? (
            <View style={styles.appliedCouponBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.appliedCouponCode}>{appliedCouponCode}</Text>
                <Text style={styles.appliedCouponText}>You saved ₹{discountAmount.toFixed(2)}!</Text>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeCouponBtnWrap}>
                <Text style={styles.removeCouponBtn}>REMOVE</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.couponInputRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity 
                  style={[styles.applyCouponBtn, applyingCoupon && styles.disabledBtn]} 
                  onPress={handleApplyCoupon}
                  disabled={applyingCoupon || !couponCode}
                >
                  {applyingCoupon ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.applyCouponBtnText}>APPLY</Text>}
                </TouchableOpacity>
              </View>
              {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
            </View>
          )}
        </View>

        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Details</Text>

          {launchSettings?.launchDayActive && (
            <View style={styles.launchOffer}>
              <Text style={styles.launchOfferTitle}>🎉 LAUNCH DAY OFFER</Text>
              <Text style={styles.launchOfferText}>FREE DELIVERY TODAY</Text>
              <Text style={styles.launchOfferText}>Online Payment: Currently Unavailable</Text>
              <Text style={styles.launchOfferText}>Available Payment: Cash on Delivery</Text>
            </View>
          )}
          
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

          {discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabelDiscount}>Discount applied</Text>
              <Text style={styles.billValueDiscount}>- ₹{discountAmount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>To Pay</Text>
            <Text style={styles.totalValue}>₹{finalTotal.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <Text style={styles.billTitle}>Payment Method</Text>
          {launchSettings?.onlinePaymentEnabled !== false && <TouchableOpacity 
            style={[styles.codRow, paymentMethod === 'card' && styles.radioSelected]} 
            onPress={() => setPaymentMethod('card')}
            activeOpacity={0.9}
          >
            <View style={styles.paymentIconWrap}>
              <Ionicons name="card" size={24} color={paymentMethod === 'card' ? '#E86A22' : '#888'} />
            </View>
            <View style={styles.paymentTextWrap}>
              <Text style={styles.codText}>Pay Online</Text>
              <Text style={styles.paymentSub}>Credit, Debit, UPI via Razorpay</Text>
            </View>
            <View style={[styles.radioActive, paymentMethod !== 'card' && styles.radioInactive]}>
              {paymentMethod === 'card' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>}
          <View style={{ height: 16 }} />
          <TouchableOpacity 
            style={[styles.codRow, paymentMethod === 'cod' && styles.radioSelected]} 
            onPress={() => setPaymentMethod('cod')}
            activeOpacity={0.9}
          >
            <View style={styles.paymentIconWrap}>
              <Ionicons name="cash" size={24} color={paymentMethod === 'cod' ? '#E86A22' : '#888'} />
            </View>
            <View style={styles.paymentTextWrap}>
              <Text style={styles.codText}>Cash on Delivery</Text>
              <Text style={styles.paymentSub}>Pay at your doorstep</Text>
            </View>
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
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <View>
                <Text style={styles.checkoutTotal}>₹{finalTotal.toFixed(2)}</Text>
                <Text style={styles.checkoutSub}>TOTAL</Text>
              </View>
              <Text style={styles.checkoutText}>Place Order <Ionicons name="arrow-forward" size={18} color="#fff" /></Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  emptyIconWrap: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#FFEAE6', alignItems: 'center', justifyContent: 'center', marginBottom: 32 },
  emptyIconImage: { width: 70, height: 70, opacity: 0.8 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#171717', marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#888', marginBottom: 32 },
  browseBtn: { backgroundColor: '#E86A22', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, shadowColor: '#E86A22', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  browseText: { color: '#fff', fontSize: 16, fontWeight: '900' },

  header: { backgroundColor: '#fff', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: 16 },
  title: { fontSize: 20, fontWeight: '900', color: '#171717' },

  scroll: { padding: 16, paddingBottom: 120 },
  
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  billTitle: { fontSize: 18, fontWeight: '900', color: '#171717', marginLeft: 8 },
  
  addressCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  addressBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#FAFAFA', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  addressTextWrap: { flex: 1, marginRight: 16 },
  addressText: { fontSize: 14, color: '#555', lineHeight: 22, fontWeight: '500' },
  changeAddressBtnWrap: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFEAE6', borderRadius: 8 },
  changeAddressBtn: { color: '#E86A22', fontWeight: '800', fontSize: 12 },
  addAddressBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderWidth: 1, borderColor: '#E86A22', borderRadius: 16, borderStyle: 'dashed', backgroundColor: '#FFF5E6' },
  addAddressBtnText: { color: '#E86A22', fontWeight: '800', fontSize: 15 },

  itemsCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  itemBorder: { borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  itemInfo: { flex: 1, paddingRight: 16 },
  itemName: { fontSize: 16, fontWeight: '800', color: '#171717', marginBottom: 6 },
  itemPrice: { fontSize: 16, fontWeight: '800', color: '#171717' },
  
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#EBEBEB' },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  qtyBtnText: { color: '#E86A22', fontSize: 18, fontWeight: '900' },
  qtyText: { color: '#171717', fontSize: 15, fontWeight: '900', paddingHorizontal: 4 },
  
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  addMoreText: { color: '#E86A22', fontWeight: '800', fontSize: 14, marginLeft: 4 },

  couponCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  couponInputRow: { flexDirection: 'row', alignItems: 'center' },
  couponInput: { flex: 1, height: 50, backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EBEBEB', borderRadius: 16, paddingHorizontal: 16, fontSize: 15, marginRight: 12, textTransform: 'uppercase', color: '#171717', fontWeight: '700' },
  applyCouponBtn: { backgroundColor: '#171717', height: 50, paddingHorizontal: 24, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  applyCouponBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  couponErrorText: { color: '#EF4444', fontSize: 13, marginTop: 12, fontWeight: '600' },
  appliedCouponBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#A7F3D0' },
  appliedCouponCode: { fontSize: 16, fontWeight: '900', color: '#059669', marginBottom: 4 },
  appliedCouponText: { fontSize: 13, color: '#059669', fontWeight: '600' },
  removeCouponBtnWrap: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 },
  removeCouponBtn: { color: '#EF4444', fontWeight: '800', fontSize: 12 },

  billCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  launchOffer: { backgroundColor: '#FFF4E8', borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FFD5A8' },
  launchOfferTitle: { color: '#A84B00', fontSize: 14, fontWeight: '900', marginBottom: 4 },
  launchOfferText: { color: '#7A450F', fontSize: 12, fontWeight: '700', marginTop: 2 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  billLabel: { fontSize: 14, color: '#555', fontWeight: '600' },
  billValue: { fontSize: 14, color: '#171717', fontWeight: '800' },
  billLabelDiscount: { fontSize: 14, color: '#059669', fontWeight: '700' },
  billValueDiscount: { fontSize: 14, color: '#059669', fontWeight: '800' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0F0F0', marginTop: 8, paddingTop: 16, marginBottom: 0 },
  totalLabel: { fontSize: 18, color: '#171717', fontWeight: '900' },
  totalValue: { fontSize: 20, color: '#E86A22', fontWeight: '900' },

  paymentCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, elevation: 3 },
  codRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFA', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#F0F0F0' },
  radioSelected: { borderColor: '#E86A22', backgroundColor: '#FFF5E6' },
  paymentIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginRight: 16 },
  paymentTextWrap: { flex: 1 },
  codText: { fontSize: 16, fontWeight: '800', color: '#171717', marginBottom: 4 },
  paymentSub: { fontSize: 12, color: '#888', fontWeight: '500' },
  radioActive: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#E86A22', alignItems: 'center', justifyContent: 'center' },
  radioInactive: { borderColor: '#ccc' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E86A22' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: '#F0F0F0', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 16, elevation: 10 },
  checkoutBtn: { backgroundColor: '#E86A22', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#E86A22', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  disabledBtn: { opacity: 0.7 },
  checkoutTotal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  checkoutSub: { color: '#FFD8C4', fontSize: 11, fontWeight: '800', marginTop: 2 },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: '900' }
});
