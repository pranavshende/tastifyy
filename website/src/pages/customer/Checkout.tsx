import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import { CreditCard, Banknote, MapPin, Receipt, CheckCircle, Tag, Wallet, Landmark, Plus, Check } from 'lucide-react';

async function geocodeAddress(addressLine: string, city: string, state: string, pincode: string) {
  const query = [addressLine, city, state, pincode].filter(Boolean).join(', ');
  if (!query) return { latitude: 0, longitude: 0 };

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, {
      headers: { 'Accept-Language': 'en' },
    });
    const results = await response.json();
    if (!results[0]) return { latitude: 0, longitude: 0 };
    return { latitude: Number(results[0].lat), longitude: Number(results[0].lon) };
  } catch {
    return { latitude: 0, longitude: 0 };
  }
}

export default function Checkout() {
  const navigate = useNavigate();
  const cart = useCartStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'upi' | 'net_banking' | 'wallet'>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home', address_line: '', city: '', state: '', pincode: '', latitude: 0, longitude: 0, is_default: true
  });
  const [isAddressConfirmed, setIsAddressConfirmed] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [launchSettings, setLaunchSettings] = useState<any>(null);

  useEffect(() => {
    fetchAddresses();
    fetchProfile();
    api.get('/orders/checkout-config').then(res => setLaunchSettings(res.data.data)).catch(() => undefined);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/customer/profile');
      setProfile(res.data.data);
    } catch (err) {
      console.error('Failed to load profile', err);
    }
  };

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/customer/addresses');
      const data = res.data.data;
      setAddresses(data);
      if (data.length > 0) {
        const defaultAddr = data.find((a: any) => a.is_default) || data[0];
        setSelectedAddressId(defaultAddr.id);
      }
    } catch (err) {
      console.error('Failed to load addresses', err);
    }
  };

  const rawTotals = cart.getTotals();
  const totals = launchSettings?.freeDeliveryEnabled
    ? { ...rawTotals, deliveryFee: 0, totalAmount: rawTotals.totalAmount - rawTotals.deliveryFee }
    : rawTotals;
  const grandTotal = Math.max(0, totals.totalAmount - (appliedCoupon?.discountAmount || 0));

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const coordinates = newAddress.latitude === 0 && newAddress.longitude === 0
        ? await geocodeAddress(newAddress.address_line, newAddress.city, newAddress.state, newAddress.pincode)
        : { latitude: newAddress.latitude, longitude: newAddress.longitude };
      const { data } = await api.post('/customer/addresses', { ...newAddress, ...coordinates });
      const address = data.data;
      setAddresses(prev => [address, ...prev]);
      setSelectedAddressId(address.id);
      setIsAddressConfirmed(false);
      setShowAddAddressForm(false);
      setNewAddress({ label: 'Home', address_line: '', city: '', state: '', pincode: '', latitude: 0, longitude: 0, is_default: true });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add delivery address');
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Location is not supported by this browser. Please enter your address manually.');
      return;
    }

    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (!response.ok) throw new Error('Reverse geocoding failed');
        const data = await response.json();
        const address = data.address || {};
        setNewAddress({
          label: 'Home',
          address_line: data.display_name || address.road || '',
          city: address.city || address.town || address.village || address.county || '',
          state: address.state || '',
          pincode: address.postcode || '',
          latitude: coords.latitude,
          longitude: coords.longitude,
          is_default: addresses.length === 0
        });
        setShowAddressModal(true);
        setShowAddAddressForm(true);
      } catch {
        setError('Could not determine the address from your location. Please enter it manually.');
      } finally {
        setIsLocating(false);
      }
    }, () => {
      setIsLocating(false);
      setError('Location permission was denied. Please enter your delivery address manually.');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    try {
      const { data } = await api.post('/orders/validate-coupon', {
        code: couponCode,
        restaurant_id: cart.restaurantId,
        item_subtotal: totals.itemSubtotal
      });
      if (data.success) {
        setAppliedCoupon({ code: data.data.code, discountAmount: data.data.discount_amount });
      } else {
        setCouponError('Invalid coupon code');
      }
    } catch (err: any) {
      setCouponError(err.response?.data?.error?.message || 'Failed to validate coupon');
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0 || !cart.restaurantId) {
      setError('Your cart is empty');
      return;
    }
    setLoading(true);
    setError(null);
    const idempotencyKey = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      
    if (!selectedAddressId) {
      setError('Please select a delivery address.');
      setLoading(false);
      return;
    }

    if (!isAddressConfirmed) {
      setError('Please confirm your delivery address before placing the order.');
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.post('/orders', {
        restaurant_id: cart.restaurantId,
        delivery_address_id: selectedAddressId,
        items: cart.items.map(i => ({
          menu_item_id: i.menu_item_id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        payment_method: paymentMethod,
        idempotency_key: idempotencyKey,
        special_instructions: '',
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined,
        confirm_address: isAddressConfirmed
      });

      if (data.success) {
        if (data.data.razorpay_order_id) {
          // Real Razorpay flow
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: data.data.total_amount * 100,
            currency: 'INR',
            name: 'Tastifyy',
            description: 'Food Order',
            order_id: data.data.razorpay_order_id,
            prefill: {
              contact: profile?.phone || '',
              email: profile?.email || '',
              method: paymentMethod === 'upi' ? 'upi' : undefined
            },
            handler: async function (response: any) {
              try {
                setLoading(true);
                const verifyRes = await api.post('/orders/verify-payment', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });
                
                if (verifyRes.data.success) {
                  cart.clearCart();
                  setPlacedOrderId(data.data.id);
                  setOrderPlaced(true);
                }
              } catch (verifyErr: any) {
                setError(verifyErr.response?.data?.error?.message || 'Payment verification failed');
              } finally {
                setLoading(false);
              }
            },
            theme: { color: '#E86A22' },
            modal: {
              ondismiss: function() {
                setLoading(false);
              }
            }
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.on('payment.failed', function (response: any) {
            setError(response.error.description);
          });
          rzp.open();
        } else if (paymentMethod === 'cod') {
          cart.clearCart();
          setPlacedOrderId(data.data.id);
          setOrderPlaced(true);
          setLoading(false);
        } else {
          setError('Failed to initiate payment gateway');
          setLoading(false);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to place order');
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center p-4 text-center font-sans">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-[6px] border-white">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4">Order Confirmed!</h1>
        <p className="text-gray-500 mb-8 max-w-md font-medium text-lg">
          Your order is now being processed. Track its status in real-time.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link 
            to={`/customer/orders/${placedOrderId}`} 
            className="px-8 py-4 bg-brand-primary text-white rounded-xl font-bold shadow-lg shadow-brand-primary/30 hover:bg-brand-secondary transition-all w-full sm:w-auto text-center"
          >
            Track Order Live
          </Link>
          <Link 
            to="/customer/home" 
            className="px-8 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors w-full sm:w-auto text-center shadow-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col">
        <Header showSearch={false} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 font-medium mb-8">Looks like you haven't added anything to your cart yet.</p>
          <button onClick={() => navigate('/customer/restaurants')} className="px-8 py-4 bg-brand-primary text-white font-bold rounded-xl shadow-md hover:bg-brand-secondary transition-colors">
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark flex flex-col pb-32">
      <Header showSearch={false} />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 w-full py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>

        {launchSettings?.launchDayActive && (
          <div className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-4 text-orange-900">
            <div className="font-black">🎉 LAUNCH DAY OFFER</div>
            <div className="font-bold">FREE DELIVERY TODAY</div>
            <div className="text-sm mt-1">Online Payment: Currently Unavailable · Available Payment: Cash on Delivery</div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-bold flex items-center justify-between">
            {error}
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT COLUMN: Address & Items */}
          <div className="flex-1 space-y-6">
            
            {/* Delivery Address */}
            <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-primary"></div>
              <div className="flex items-start">
                <div className="bg-orange-50 p-3 rounded-full mr-4 text-brand-primary shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                    {addresses.length > 0 && (
                      <button onClick={() => setShowAddressModal(true)} className="text-sm font-bold text-brand-primary hover:underline">Change</button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:text-brand-secondary disabled:opacity-60"
                  >
                    <MapPin className="w-4 h-4" />
                    {isLocating ? 'Detecting location...' : 'Use Current Location'}
                  </button>
                  {addresses.length > 0 && selectedAddressId ? (() => {
                    const addr = addresses.find(a => a.id === selectedAddressId);
                    if (!addr) return null;
                    return (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md uppercase">{addr.label}</span>
                        </div>
                        <p className="text-gray-600 font-medium leading-relaxed mb-4">
                          {addr.address_line}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        
                        {!isAddressConfirmed ? (
                          <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl mt-4">
                            <h3 className="font-bold text-brand-dark mb-1">📍 Confirm Delivery Address</h3>
                            <p className="text-sm text-gray-600 mb-3">Is this address correct for delivery?</p>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => setIsAddressConfirmed(true)}
                                className="bg-brand-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-brand-secondary transition-colors"
                              >
                                Confirm Address
                              </button>
                              <button 
                                onClick={() => {
                                  setIsAddressConfirmed(false);
                                  setShowAddressModal(true);
                                }}
                                className="bg-white border border-gray-200 text-gray-700 text-sm font-bold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Edit Address
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-green-600 font-bold text-sm mt-2 bg-green-50 p-2 rounded-lg inline-flex">
                            <Check className="w-4 h-4" /> Address Confirmed
                          </div>
                        )}
                      </>
                    );
                  })() : (
                    <div className="mt-3">
                      <p className="text-red-500 font-medium text-sm mb-3">No delivery address found.</p>
                      <button onClick={() => { setShowAddressModal(true); setShowAddAddressForm(true); }} className="inline-flex items-center gap-2 text-sm font-bold text-white bg-gray-900 px-4 py-2 rounded-lg hover:bg-black transition-colors">
                        <Plus className="w-4 h-4" /> Add Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Receipt className="w-5 h-5 mr-3 text-brand-primary" />
                Order Items
              </h2>
              <div className="space-y-5">
                {cart.items.map((item) => (
                  <div key={item.menu_item_id} className="flex justify-between items-start group">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-20 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-between font-bold text-brand-primary shrink-0 overflow-hidden shadow-sm">
                          <button onClick={() => cart.updateQuantity(item.menu_item_id, item.quantity - 1)} className="w-1/3 h-full flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500">
                            -
                          </button>
                          <span className="text-sm">{item.quantity}</span>
                          <button onClick={() => cart.updateQuantity(item.menu_item_id, item.quantity + 1)} className="w-1/3 h-full flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500">
                            +
                          </button>
                        </div>
                        <button onClick={() => cart.removeItem(item.menu_item_id)} className="text-[10px] text-gray-400 hover:text-red-500 font-bold uppercase underline decoration-gray-300 underline-offset-2">Remove</button>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg group-hover:text-brand-primary transition-colors">{item.name}</h4>
                        <p className="text-gray-500 font-medium mt-1">₹{item.price} each</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
                <button onClick={() => navigate(-1)} className="text-brand-primary font-bold hover:underline flex items-center">
                  + Add more items
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Bill Summary & Payment */}
          <div className="w-full lg:w-[420px] space-y-6 lg:sticky lg:top-24 lg:self-start">
            
            {/* Coupons */}
            <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-3 text-brand-primary" />
                Coupons & Offers
              </h2>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 p-4 rounded-xl">
                  <div>
                    <div className="font-bold text-green-800 uppercase tracking-wide">"{appliedCoupon.code}" APPLIED</div>
                    <div className="text-green-600 text-sm font-medium mt-0.5">You saved ₹{appliedCoupon.discountAmount.toFixed(2)}</div>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="text-red-500 hover:text-red-700 font-bold text-sm">
                    REMOVE
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 relative">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 font-bold text-gray-700 uppercase focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    className="bg-gray-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-black transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-red-500 font-medium text-sm mt-2">{couponError}</p>}
            </div>

            {/* Bill Summary */}
            <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold text-gray-900 mb-4">Bill Summary</h2>
              
              <div className="space-y-3 font-medium text-gray-600">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span className="text-gray-900">₹{totals.itemSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-gray-900">₹{totals.deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span className="text-gray-900">₹{totals.platformFee.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-4 mt-4 border-t border-gray-100 flex justify-between items-end">
                  <div>
                    <div className="text-xl font-black text-gray-900">To Pay</div>
                  </div>
                  <div className="text-2xl font-black text-brand-dark">₹{grandTotal.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 mb-32 lg:mb-0">
              <h2 className="text-base font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'cod', icon: <Banknote />, label: 'Cash on Delivery', desc: 'Pay when your order arrives' },
                  { id: 'upi', icon: <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-5 w-auto" alt="UPI" />, label: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },
                  { id: 'card', icon: <CreditCard />, label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
                  { id: 'net_banking', icon: <Landmark />, label: 'Net Banking', desc: 'All Indian banks supported' },
                  { id: 'wallet', icon: <Wallet />, label: 'Wallets', desc: 'Paytm, Amazon Pay, Mobikwik' }
                ].filter(method => method.id === 'cod' || launchSettings?.onlinePaymentEnabled !== false).map((method) => (
                  <label 
                    key={method.id} 
                    className={`flex items-center p-4 border-2 rounded-2xl cursor-pointer transition-all ${
                      paymentMethod === method.id 
                        ? 'border-brand-primary bg-orange-50/50' 
                        : 'border-gray-100 hover:border-brand-primary/30 hover:bg-gray-50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="payment" 
                      value={method.id} 
                      checked={paymentMethod === method.id} 
                      onChange={() => setPaymentMethod(method.id as any)}
                      className="w-5 h-5 text-brand-primary border-gray-300 focus:ring-brand-primary shrink-0" 
                    />
                    <div className="ml-4 flex items-center justify-center text-gray-600 w-6">
                      {method.icon}
                    </div>
                    <div className="ml-4">
                      <div className={`font-bold ${paymentMethod === method.id ? 'text-gray-900' : 'text-gray-700'}`}>{method.label}</div>
                      <div className="text-xs text-gray-500 font-medium mt-0.5">{method.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Floating Action Mobile/Desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col text-left">
            <span className="text-gray-500 font-bold text-[10px] uppercase tracking-wider">Amount to Pay</span>
            <span className="text-lg font-black text-gray-900">₹{grandTotal.toFixed(2)}</span>
          </div>
          <button 
            onClick={handlePlaceOrder}
            disabled={loading}
            className="flex-1 max-w-[200px] bg-brand-primary text-white px-6 py-3 rounded-lg font-bold text-sm shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              'Place Order'
            )}
          </button>
        </div>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Select Delivery Address</h3>
              <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none">&times;</button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto bg-gray-50/50 space-y-3">
              {showAddAddressForm ? (
                <form onSubmit={handleAddAddress} className="bg-white rounded-2xl border border-brand-primary/20 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-900">Add delivery address</h4>
                    {addresses.length > 0 && <button type="button" onClick={() => setShowAddAddressForm(false)} className="text-gray-400 text-xl">&times;</button>}
                  </div>
                  <select value={newAddress.label} onChange={e => setNewAddress({ ...newAddress, label: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2">
                    <option>Home</option><option>Work</option><option>Other</option>
                  </select>
                  <input required placeholder="Address line" value={newAddress.address_line} onChange={e => setNewAddress({ ...newAddress, address_line: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <input required placeholder="City" value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} className="border border-gray-200 rounded-xl px-3 py-2" />
                    <input required placeholder="State" value={newAddress.state} onChange={e => setNewAddress({ ...newAddress, state: e.target.value })} className="border border-gray-200 rounded-xl px-3 py-2" />
                  </div>
                  <input required placeholder="Pincode" value={newAddress.pincode} onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2" />
                  <button type="submit" className="w-full py-3 rounded-xl bg-brand-primary text-white font-bold">Save Address</button>
                </form>
              ) : addresses.map((address) => (
                <div 
                  key={address.id} 
                  onClick={() => { 
                    setSelectedAddressId(address.id); 
                    setIsAddressConfirmed(false); 
                    setShowAddressModal(false); 
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddressId === address.id ? 'border-brand-primary bg-orange-50/30' : 'border-gray-100 bg-white hover:border-brand-primary/30'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded uppercase text-[10px] tracking-wider">{address.label}</span>
                      {address.is_default && <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded uppercase tracking-wider">Default</span>}
                    </div>
                    {selectedAddressId === address.id && <Check className="w-5 h-5 text-brand-primary" />}
                  </div>
                  <p className="text-gray-600 font-medium text-sm leading-relaxed mt-2 pr-4">
                    {address.address_line}, {address.city}, {address.state} - {address.pincode}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 bg-white">
                  <button onClick={() => setShowAddAddressForm(true)} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-brand-primary border-2 border-brand-primary/20 hover:bg-orange-50 transition-colors">
                <Plus className="w-5 h-5" /> Add New Address
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
