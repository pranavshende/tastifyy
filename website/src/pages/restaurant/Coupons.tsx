import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus, Ticket, Power } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_value: number;
  max_discount_cap: number | null;
  max_uses_per_user: number;
  max_uses_total: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  funded_by: string;
}

export default function RestaurantCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    min_order_value: '',
    max_discount_cap: '',
    max_uses_per_user: '1',
    max_uses_total: '100',
    valid_until: ''
  });

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/coupons/restaurant');
      if (data.success) setCoupons(data.data);
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      setCoupons(coupons.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
      await api.patch(`/coupons/${id}/toggle`);
    } catch (err) {
      console.error('Failed to toggle coupon', err);
      fetchCoupons(); // Revert
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        discount_value: Number(formData.discount_value),
        min_order_value: Number(formData.min_order_value),
        max_discount_cap: formData.max_discount_cap ? Number(formData.max_discount_cap) : null,
        max_uses_per_user: Number(formData.max_uses_per_user),
        max_uses_total: Number(formData.max_uses_total),
        valid_until: formData.valid_until || null
      };
      
      const { data } = await api.post('/coupons', payload);
      if (data.success) {
        setCoupons([data.data, ...coupons]);
        setShowCreateModal(false);
        setFormData({
          code: '', discount_type: 'percentage', discount_value: '', min_order_value: '',
          max_discount_cap: '', max_uses_per_user: '1', max_uses_total: '100', valid_until: ''
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create coupon');
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Coupons & Offers</h1>
          <p className="text-gray-500 font-medium mt-1">Manage promotional campaigns to boost sales.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-secondary transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ticket className="w-10 h-10 text-brand-primary" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Active Coupons</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">You haven't created any promotional offers yet. Create one now to attract more customers!</p>
          <button onClick={() => setShowCreateModal(true)} className="text-brand-primary font-bold hover:underline">
            + Create First Coupon
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {coupons.map(coupon => (
            <div key={coupon.id} className={`bg-white rounded-2xl p-6 border shadow-sm transition-all ${coupon.is_active ? 'border-brand-primary/30' : 'border-gray-200 opacity-75'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="bg-orange-50 border border-brand-primary/20 text-brand-primary font-black px-4 py-2 rounded-lg text-xl tracking-wider">
                  {coupon.code}
                </div>
                <button 
                  onClick={() => handleToggle(coupon.id)}
                  className={`p-2 rounded-full transition-colors ${coupon.is_active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                  title={coupon.is_active ? 'Deactivate' : 'Activate'}
                >
                  <Power className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-black text-gray-900">
                  {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                </h3>
                <p className="text-sm font-medium text-gray-500">
                  On orders above ₹{coupon.min_order_value}
                  {coupon.max_discount_cap ? ` • Up to ₹${coupon.max_discount_cap}` : ''}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 font-medium">
                <span>Uses: {coupon.max_uses_total} max</span>
                <span>{coupon.funded_by === 'restaurant' ? 'Funded by You' : 'Platform Funded'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in-up">
            <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <h2 className="text-2xl font-black text-gray-900">Create New Coupon</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Coupon Code *</label>
                  <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-black text-lg uppercase focus:ring-2 focus:ring-brand-primary outline-none" placeholder="E.g. WELCOME50" />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Discount Type</label>
                  <div className="flex gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" className="peer sr-only" name="type" checked={formData.discount_type === 'percentage'} onChange={() => setFormData({...formData, discount_type: 'percentage'})} />
                      <div className="text-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl peer-checked:bg-brand-primary/10 peer-checked:border-brand-primary peer-checked:text-brand-primary font-bold transition-all">Percentage</div>
                    </label>
                    <label className="flex-1 cursor-pointer">
                      <input type="radio" className="peer sr-only" name="type" checked={formData.discount_type === 'flat'} onChange={() => setFormData({...formData, discount_type: 'flat'})} />
                      <div className="text-center px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl peer-checked:bg-brand-primary/10 peer-checked:border-brand-primary peer-checked:text-brand-primary font-bold transition-all">Flat ₹</div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Discount Value *</label>
                  <input type="number" required min="1" max={formData.discount_type === 'percentage' ? 100 : 5000} value={formData.discount_value} onChange={e => setFormData({...formData, discount_value: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-brand-primary outline-none" placeholder={formData.discount_type === 'percentage' ? 'e.g. 20 (%)' : 'e.g. 150 (₹)'} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Min Order Value (₹) *</label>
                  <input type="number" required min="1" value={formData.min_order_value} onChange={e => setFormData({...formData, min_order_value: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-brand-primary outline-none" placeholder="e.g. 499" />
                </div>

                {formData.discount_type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Max Discount Cap (₹) (Optional)</label>
                    <input type="number" value={formData.max_discount_cap} onChange={e => setFormData({...formData, max_discount_cap: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-brand-primary outline-none" placeholder="e.g. 120" />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Max Uses Total</label>
                  <input type="number" required min="1" value={formData.max_uses_total} onChange={e => setFormData({...formData, max_uses_total: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:border-brand-primary outline-none" placeholder="e.g. 100" />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all">Create Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
