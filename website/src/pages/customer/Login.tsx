import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, UtensilsCrossed } from 'lucide-react';

export default function CustomerLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (isRegister) {
        res = await api.post('/auth/register', { email, password, name, phone, role: 'customer' });
      } else {
        res = await api.post('/auth/login', { email, password });
      }
      const token = res.data.session?.access_token;
      if (!token || !res.data.user) throw new Error('Invalid response from server');
      setAuth(res.data.user, token);
      navigate('/customer/home');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Authentication failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side - Brand / Image */}
        <div className="md:w-1/2 bg-gradient-to-br from-brand-primary to-orange-600 p-12 text-white flex flex-col justify-center relative overflow-hidden">
          {/* Abstract Food Visuals */}
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 text-white/10 rotate-12">
            <UtensilsCrossed className="w-48 h-48" />
          </div>
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-12 hover:opacity-90 transition-opacity">
              <div className="w-12 h-12 rounded-xl bg-white text-brand-primary flex items-center justify-center text-2xl font-black shadow-lg">
                T
              </div>
              <span className="text-2xl font-black tracking-tight">Tastifyy</span>
            </Link>
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Your next favorite meal is waiting.</h1>
            <p className="text-white/90 text-lg font-medium leading-relaxed max-w-sm">
              Discover restaurants, explore dishes and order what you're craving.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-8 md:p-12">
          <div className="max-w-sm mx-auto">
            <h2 className="text-3xl font-bold text-brand-dark mb-2">
              {isRegister ? 'Create Account' : 'Welcome back'}
            </h2>
            <p className="text-gray-500 mb-8">
              {isRegister ? 'Sign up as a customer' : 'Log in to your customer account'}
            </p>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
                {typeof error === 'object' ? (error as any).message || JSON.stringify(error) : String(error)}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
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
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  {!isRegister && (
                    <Link to="#" className="text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all pr-12"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-primary/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
              >
                {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? (isRegister ? 'Creating Account...' : 'Signing in...') : (isRegister ? 'Sign Up' : 'Sign In')}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
              <button 
                onClick={() => setIsRegister(!isRegister)}
                className="ml-2 font-bold text-brand-primary hover:text-brand-secondary transition-colors"
              >
                {isRegister ? 'Log in' : 'Sign up'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
