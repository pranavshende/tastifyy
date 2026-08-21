import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import { CreditCard, Banknote, MapPin, Receipt, CheckCircle, Tag, Wallet, Landmark } from 'lucide-react';

export default function Checkout() {
  const navigate = useNavigate();
  const cart = useCartStore();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Checkout State
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'upi' | 'net_banking' | 'wallet'>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const totals = cart.getTotals();
  const grandTotal = Math.max(0, totals.totalAmount - (appliedCoupon?.discountAmount || 0));

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    try {
      // In a real scenario, there'd be a /validate-coupon endpoint. 
      // For MVP, we pass it to the order creation and it validates there, 
      // but to show it on UI first, let's mock validation here.
      // We will pretend COUPON50 gives 50 rs off, and WELCOME gives 10%.
      if (couponCode.toUpperCase() === 'COUPON50') {
        setAppliedCoupon({ code: 'COUPON50', discountAmount: 50 });
      } else if (couponCode.toUpperCase() === 'WELCOME') {
        setAppliedCoupon({ code: 'WELCOME', discountAmount: totals.itemSubtotal * 0.1 });
      } else {
        setCouponError('Invalid coupon code');
      }
    } catch {
      setCouponError('Failed to validate coupon');
    }
  };

  const handlePlaceOrder = async () => {
    if (cart.items.length === 0 || !cart.restaurantId) {
      setError('Your cart is empty');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/orders', {
        restaurant_id: cart.restaurantId,
        items: cart.items.map(i => ({
          menu_item_id: i.menu_item_id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          // Customizations not sent in MVP backend yet, but UI is prepared
        })),
        payment_method: paymentMethod,
        special_instructions: '',
        coupon_code: appliedCoupon ? appliedCoupon.code : undefined
      });

      if (data.success) {
        cart.clearCart();
        setPlacedOrderId(data.data.id);
        setOrderPlaced(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to place order');
    } finally {
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
        <Header location="Mumbai" showSearch={false} />
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
      <Header location="Mumbai" showSearch={false} />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 w-full py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Checkout</h1>
        
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
                    <button className="text-sm font-bold text-brand-primary hover:underline">Change</button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md uppercase">Home</span>
                  </div>
                  <p className="text-gray-600 font-medium leading-relaxed">
                    123 Tastifyy Street, Food Valley, Mumbai, Maharashtra 400001
                  </p>
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
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-brand-primary shrink-0">
                        {item.quantity}
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
                <div className="flex justify-between">
                  <span>Taxes (5%)</span>
                  <span className="text-gray-900">₹{totals.taxAmount.toFixed(2)}</span>
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
                    <div className="text-xs text-gray-500">Incl. all taxes and charges</div>
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
                ].map((method) => (
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
    </div>
  );
}
