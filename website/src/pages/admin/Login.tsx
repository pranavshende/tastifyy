import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function AdminLogin() {
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password, role: 'admin' });
      const token = res.data.token || res.data.session?.access_token;
      setAuth(res.data.user, token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 selection:bg-brand-primary">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary mx-auto flex items-center justify-center mb-4 shadow-lg shadow-brand-primary/20">
            <span className="text-white font-black text-3xl">T</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Admin Console</h2>
          <p className="text-gray-400 mt-2">Sign in to manage the Tastifyy platform</p>
        </div>

        <div className="bg-gray-800 rounded-3xl shadow-2xl p-8 border border-gray-700">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-xl mb-6 text-sm font-medium border border-red-500/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all placeholder-gray-600"
                placeholder="admin@tastifyy.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Master Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all placeholder-gray-600"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? 'Authenticating...' : 'Access Console'}
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/" className="text-gray-500 hover:text-white transition-colors text-sm font-medium">
            &larr; Back to main site
          </Link>
        </div>
      </div>
    </div>
  );
}
