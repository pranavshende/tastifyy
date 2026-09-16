import React, { useState } from 'react';
import api from '../../api/axios';
import { Logo } from '../../components/ui/Logo';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function RestaurantRegister() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '', type: 'restaurant', owner_name: '', phone: '', email: '', password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const authRes = await api.post('/auth/register', {
        email: formData.email, password: formData.password, name: formData.owner_name,
        phone: formData.phone, role: 'restaurant_partner'
      });
      const token = authRes.data.session?.access_token;
      if (!token || !authRes.data.user) throw new Error('Invalid account session returned');
      setAuth(authRes.data.user, token);
      await api.post('/onboarding/restaurant', formData);
      navigate('/restaurant/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Failed to register restaurant');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <Logo size="lg" textSuffix="Partner" className="mt-6 mb-4" />
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
              <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E86A22] focus:border-[#E86A22]" onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Owner Name</label>
              <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E86A22] focus:border-[#E86A22]" onChange={(e) => setFormData({...formData, owner_name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="text" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E86A22] focus:border-[#E86A22]" onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E86A22] focus:border-[#E86A22]" onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" required minLength={6} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#E86A22] focus:border-[#E86A22]" onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
            {error && <div className="bg-red-50 text-red-600 border border-red-100 rounded-md p-3 text-sm">{error}</div>}
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#E86A22] hover:bg-[#d55e1a] focus:outline-none disabled:opacity-60">
              {loading ? 'Creating Account...' : 'Create Partner Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
