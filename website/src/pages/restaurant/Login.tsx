import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function RestaurantLogin() {
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
        const res = await api.post('/auth/register', { email, password, name, phone, role: 'restaurant_partner' });
        const token = res.data.token || res.data.session?.access_token;
        setAuth(res.data.user, token);
        navigate('/onboarding/restaurant');
      } else {
        const res = await api.post('/auth/login', { email, password, role: 'restaurant_partner' });
        const token = res.data.token || res.data.session?.access_token;
        setAuth(res.data.user, token);
        navigate('/restaurant/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row-reverse">
        
        {/* Left Side - Brand / Image (Reversed for Restaurant to differentiate) */}
        <div className="md:w-1/2 bg-brand-dark p-12 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <Link to="/" className="inline-block mb-8">
              <div className="w-12 h-12 rounded-xl bg-brand-primary text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-brand-primary/30">
                T
              </div>
            </Link>
            <h1 className="text-4xl font-black mb-4 leading-tight">Grow your business with us.</h1>
            <p className="text-gray-400 text-lg">Manage orders, update menus, and reach more customers.</p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-8 md:p-12">
          <div className="max-w-sm mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isRegister ? 'Partner Sign Up' : 'Partner Portal'}
            </h2>
            <p className="text-gray-500 mb-8">
              {isRegister ? 'Create your restaurant partner account' : 'Log in to manage your restaurant'}
            </p>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                  placeholder="partner@restaurant.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-brand-primary/20 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {loading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Log In')}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              {isRegister ? 'Already a partner?' : "Want to join Tastifyy?"}
              <button 
                onClick={() => setIsRegister(!isRegister)}
                className="ml-2 font-bold text-brand-dark hover:text-black transition-colors"
              >
                {isRegister ? 'Log in here' : 'Sign up here'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
