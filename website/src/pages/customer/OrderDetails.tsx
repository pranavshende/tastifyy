import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import { ArrowLeft, MapPin, Receipt, Phone, AlertCircle, RefreshCw, MessageSquareWarning, Star, CheckCircle } from 'lucide-react';
import socketService from '../../api/socket';

export default function OrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // UI States for Modals
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/orders/customer/${id}`);
        if (data.success) {
          setOrder(data.data);
        } else {
          setError('Failed to fetch order details');
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    
    // Real-time Socket Event Listeners
    const socket = socketService.getSocket();
    if (socket) {
      const handleStatusUpdate = (payload: any) => {
        if (payload.orderId === id) {
          setOrder((prev: any) => prev ? { ...prev, status: payload.status, cancellation_reason: payload.cancellation_reason || prev.cancellation_reason } : prev);
          
          const label = payload.status.replace(/_/g, ' ').toUpperCase();
          setToast(`Update: Your order is now ${label}`);
          setTimeout(() => setToast(''), 4000);
        }
      };

      const events = ['order:restaurant_confirmed', 'order:accepted', 'order:rejected', 'order:preparing', 'order:ready', 'order:ready_for_pickup', 'order:delivered', 'order:cancelled'];
      events.forEach(event => socket.on(event, handleStatusUpdate));

      socketService.setReconnectCallback(fetchOrder);

      return () => {
        events.forEach(event => socket.off(event, handleStatusUpdate));
        socketService.setReconnectCallback(null as any);
      };
    }
  }, [id]);

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col">
        <Header location="Mumbai" showSearch={false} />
        <main className="max-w-3xl mx-auto w-full p-6 space-y-6">
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
          <LoadingSkeleton type="card" />
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col">
        <Header location="Mumbai" showSearch={false} />
        <main className="flex-1 flex items-center justify-center p-6">
          <EmptyState 
            title="Order not found" 
            description={error || "We couldn't load the details for this order."}
            action={<Link to="/customer/orders" className="text-brand-primary font-bold hover:underline">Go back to orders</Link>}
          />
        </main>
      </div>
    );
  }

  const timelineStages = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'restaurant_confirmed', label: 'Restaurant Confirmed' },
    { key: 'preparing', label: 'Preparing Food' },
    { key: 'ready', label: 'Ready' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const currentStageIndex = timelineStages.findIndex(s => s.key === order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'rejected';

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In MVP, just mock success
    setTimeout(() => {
      setShowSupportModal(false);
      setTicketSubmitted(true);
    }, 500);
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In MVP, just mock success
    setTimeout(() => {
      setShowRatingModal(false);
      setRatingSubmitted(true);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-brand-light pb-20 font-sans text-brand-dark flex flex-col">
      <Header location="Mumbai" showSearch={false} />
      
      {/* Sticky Top Bar for Navigation */}
      <div className="bg-white/90 backdrop-blur-md sticky top-16 z-20 shadow-sm border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/customer/orders" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight">Order #{order.id.split('-')[0].toUpperCase()}</h1>
              <p className="text-xs text-gray-500 font-medium">{new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-brand-dark text-white px-6 py-4 rounded-xl shadow-2xl z-[100] animate-fade-in-up flex items-center gap-3">
          <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"></div>
          <span className="font-bold">{toast}</span>
        </div>
      )}

      <main className="max-w-3xl mx-auto px-4 sm:px-6 w-full py-6 space-y-6">
        
        {/* Real-time Indicator & Timeline */}
        <div className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          {!isCancelled && order.status !== 'delivered' && (
            <div className="absolute top-0 right-0 bg-brand-primary/10 text-brand-primary font-bold text-xs px-4 py-2 rounded-bl-2xl flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Live Updates
            </div>
          )}

          <h2 className="text-xl font-bold text-gray-900 mb-8">Order Status</h2>

          {isCancelled ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-red-700 mb-2">Order {order.status === 'rejected' ? 'Rejected' : 'Cancelled'}</h3>
              <p className="text-red-600/80 font-medium">
                {order.cancellation_reason || 'This order could not be fulfilled.'}
              </p>
            </div>
          ) : (
            <div className="relative pt-2 pb-6">
              {/* Vertical line connecting nodes */}
              <div className="absolute left-4 sm:left-6 top-8 bottom-12 w-1 bg-gray-100 rounded-full"></div>
              
              <div className="space-y-8 relative">
                {timelineStages.map((stage, idx) => {
                  const isCompleted = currentStageIndex >= idx;
                  const isCurrent = currentStageIndex === idx;
                  const isPending = currentStageIndex < idx;

                  return (
                    <div key={stage.key} className={`flex items-center gap-6 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                      <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center z-10 shadow-sm border-4 border-white transition-colors duration-500 ${
                        isCompleted 
                          ? 'bg-brand-primary text-white' 
                          : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? <div className="w-3 h-3 bg-white rounded-full"></div> : null}
                      </div>
                      <div>
                        <h4 className={`text-lg sm:text-xl font-bold ${isCurrent ? 'text-brand-primary' : 'text-gray-900'}`}>
                          {stage.label}
                        </h4>
                        {isCurrent && (
                          <p className="text-sm text-gray-500 font-medium animate-pulse mt-1">
                            Current phase
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons (Rating & Support) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => setShowSupportModal(true)}
            className="bg-white border border-gray-200 hover:border-gray-300 p-4 rounded-xl flex items-center gap-4 text-left transition-colors shadow-sm"
          >
            <div className="bg-gray-100 p-2.5 rounded-xl text-gray-600">
              <MessageSquareWarning className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Need Help?</h4>
              <p className="text-sm text-gray-500 font-medium">Report missing items or issues</p>
            </div>
          </button>
          
          <button 
            onClick={() => setShowRatingModal(true)}
            disabled={order.status !== 'delivered'}
            className={`p-4 rounded-xl flex items-center gap-4 text-left transition-colors shadow-sm ${
              order.status === 'delivered' 
                ? 'bg-white border border-brand-primary/30 hover:border-brand-primary cursor-pointer' 
                : 'bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className={`p-2.5 rounded-xl ${order.status === 'delivered' ? 'bg-orange-50 text-brand-primary' : 'bg-gray-100 text-gray-400'}`}>
              <Star className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Rate Order</h4>
              <p className="text-sm text-gray-500 font-medium">Share your experience</p>
            </div>
          </button>
        </div>

        {/* Restaurant & Address Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Restaurant</h3>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 truncate pr-4">{order.restaurant?.name}</h2>
              <Link to={`/customer/restaurants/${order.restaurant_id}`} className="text-brand-primary text-sm font-bold hover:underline shrink-0">
                Menu
              </Link>
            </div>
            <p className="text-sm text-gray-600 flex items-center font-medium bg-gray-50 p-3 rounded-xl">
              <Phone className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" /> 
              {order.restaurant?.phone}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Delivery To</h3>
            <div className="flex items-start">
              <MapPin className="w-4 h-4 text-brand-primary mt-0.5 mr-3 shrink-0" />
              <div>
                <p className="text-gray-900 font-bold leading-relaxed">{order.delivery_address?.address_line}</p>
                <p className="text-gray-500 text-sm font-medium">{order.delivery_address?.city}, {order.delivery_address?.pincode}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Receipt className="w-4 h-4 mr-3 text-gray-400" />
            Bill Details
          </h2>
          
          <div className="space-y-4 mb-6">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start group">
                <div className="flex items-start gap-4">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-brand-primary shrink-0 text-sm">
                    {item.quantity}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{item.name_snapshot}</h4>
                  </div>
                </div>
                <span className="font-bold text-gray-900">₹{item.subtotal}</span>
              </div>
            ))}
          </div>
          
          <div className="pt-6 border-t border-dashed border-gray-200 space-y-3 font-medium text-gray-600">
            <div className="flex justify-between">
              <span>Item Total</span>
              <span className="text-gray-900">₹{order.item_subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-gray-900">₹{order.delivery_fee}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee</span>
              <span className="text-gray-900">₹{order.platform_fee}</span>
            </div>
            <div className="flex justify-between">
              <span>Taxes</span>
              <span className="text-gray-900">₹{order.tax_amount}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-green-600 font-bold">
                <span>Discount</span>
                <span>-₹{order.discount_amount}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
              <div>
                <span className="block text-xl font-black text-gray-900">Paid via {order.payment_method?.toUpperCase()}</span>
                <span className="text-xs text-gray-500">Transaction complete</span>
              </div>
              <span className="text-2xl font-black text-brand-dark">₹{order.total_amount}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Support Ticket Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSupportModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative z-10 animate-fade-in-up shadow-xl">
            <h2 className="text-2xl font-black mb-2">Report an Issue</h2>
            <p className="text-gray-500 font-medium mb-6">Our team will resolve this as soon as possible.</p>
            
            {ticketSubmitted ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg">Ticket Submitted</h3>
                <p className="text-gray-500 mt-2">We'll get back to you shortly.</p>
                <button onClick={() => { setShowSupportModal(false); setTicketSubmitted(false); }} className="mt-6 w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Issue Type</label>
                  <select required className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none font-medium">
                    <option value="">Select an issue</option>
                    <option value="missing_item">Missing Item</option>
                    <option value="wrong_item">Wrong Item</option>
                    <option value="quality">Food Quality Issue</option>
                    <option value="delivery">Delivery Issue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea required rows={4} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none resize-none font-medium" placeholder="Please describe the issue in detail..."></textarea>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setShowSupportModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Cancel</button>
                  <button type="submit" className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary shadow-lg shadow-brand-primary/20">Submit</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRatingModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative z-10 animate-fade-in-up text-center shadow-xl">
            {ratingSubmitted ? (
              <div className="py-6">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="font-black text-2xl mb-2">Thanks for rating!</h3>
                <p className="text-gray-500 font-medium">Your feedback helps us improve.</p>
                <button onClick={() => { setShowRatingModal(false); setRatingSubmitted(false); }} className="mt-8 w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black mb-2">How was your food?</h2>
                  <p className="text-gray-500 font-medium">Rate your experience with {order.restaurant?.name}</p>
                </div>
                
                <div className="flex justify-center gap-2 py-4">
                  {[1,2,3,4,5].map((star) => (
                    <button type="button" key={star} className="text-4xl text-gray-200 hover:text-yellow-400 hover:scale-110 transition-all focus:text-yellow-400">
                      ★
                    </button>
                  ))}
                </div>

                <div>
                  <textarea rows={3} className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:ring-2 focus:ring-brand-primary outline-none resize-none font-medium" placeholder="Write a review (optional)..."></textarea>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setShowRatingModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200">Skip</button>
                  <button type="submit" className="flex-1 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary shadow-lg shadow-brand-primary/20">Submit Rating</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
