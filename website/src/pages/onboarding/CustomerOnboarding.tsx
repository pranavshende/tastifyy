import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function CustomerOnboarding() {
  const { user, initAuth } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    dob: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.patch('/onboarding/customer', {
        dob: formData.dob,
        address: {
          label: 'home',
          address_line: formData.address_line,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          latitude: 0, // Mock for now
          longitude: 0,
        }
      });
      // Refresh user context if needed, then go home
      await initAuth();
      navigate('/customer/home');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        <h1 className="text-3xl font-black text-brand-dark mb-2">Welcome to Tastifyy, {user?.name}!</h1>
        <p className="text-gray-500 mb-8">Let's set up your profile so we can find the best food near you.</p>

        {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth (Optional)</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>

          <h3 className="text-lg font-bold text-gray-800 pt-4 border-t border-gray-100">Delivery Address</h3>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
            <input
              type="text"
              name="address_line"
              required
              placeholder="e.g., 123 Main St, Apt 4B"
              value={formData.address_line}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                required
                placeholder="e.g., Mumbai"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
              <input
                type="text"
                name="state"
                required
                placeholder="e.g., Maharashtra"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
            <input
              type="text"
              name="pincode"
              required
              placeholder="e.g., 400001"
              value={formData.pincode}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-primary/30 hover:shadow-brand-primary/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
