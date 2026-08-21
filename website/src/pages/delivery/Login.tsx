import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Bike } from 'lucide-react';

export default function DeliveryLogin() {
  const { setAuth } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        const res = await api.post('/auth/register', { email, password, name, phone, role: 'delivery_partner' });
        const token = res.data.token || res.data.session?.access_token;
        setAuth(res.data.user, token);
        navigate('/onboarding/delivery');
      } else {
        const res = await api.post('/auth/login', { email, password, role: 'delivery_partner' });
        const token = res.data.token || res.data.session?.access_token;
        setAuth(res.data.user, token);
        navigate('/delivery/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 mx-auto flex items-center justify-center mb-4">
            <Bike className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">
            {isRegister ? 'Join the Fleet' : 'Rider Login'}
          </h2>
          <p className="text-gray-500 mt-2 text-sm">
            {isRegister ? 'Deliver food and earn on your schedule.' : 'Welcome back, partner!'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
            {typeof error === 'object' ? (error as any).message || JSON.stringify(error) : String(error)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-brand-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-brand-primary outline-none transition-all"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-brand-primary outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-brand-primary outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all shadow-md mt-4 disabled:opacity-70"
          >
            {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Login to Dashboard')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          <Link to="/" className="hover:text-brand-primary mr-4">Home</Link>
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="font-bold text-gray-900 hover:text-brand-primary transition-colors"
          >
            {isRegister ? 'Already have an account? Login' : 'New here? Join us'}
          </button>
        </div>
      </div>
    </div>
  );
}
