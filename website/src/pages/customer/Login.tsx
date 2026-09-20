import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, UtensilsCrossed, ChevronLeft } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { GoogleLogin } from '@react-oauth/google';

type Mode = 'phone' | 'otp' | 'email';

export default function CustomerLogin() {
  const [mode, setMode] = useState<Mode>('phone');
  
  // Phone/OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRedirect = (role: string) => {
    switch (role) {
      case 'customer': navigate('/customer/home'); break;
      case 'restaurant_partner': navigate('/restaurant/dashboard'); break;
      case 'delivery_partner': navigate('/delivery/dashboard'); break;
      case 'admin': navigate('/admin/dashboard'); break;
      default: navigate('/');
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await api.post('/auth/otp/send', { phone: `+91${phone}`, role: 'customer' });
      setMode('otp');
      setResendTimer(30);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/otp/verify', { phone: `+91${phone}`, otp });
      const token = res.data.session?.access_token;
      if (!token || !res.data.user) throw new Error('Invalid response from server');
      setAuth(res.data.user, token);
      handleRedirect(res.data.user.role);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', { email, password });
      const token = res.data.session?.access_token;
      if (!token || !res.data.user) throw new Error('Invalid response from server');
      setAuth(res.data.user, token);
      handleRedirect(res.data.user.role);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential });
      const token = res.data.session?.access_token;
      if (!token || !res.data.user) throw new Error('Invalid response from server');
      setAuth(res.data.user, token);
      handleRedirect(res.data.user.role);
    } catch (err: any) {
      if (err.response?.data?.error?.code === 'GOOGLE_USER_NOT_REGISTERED') {
        const { email: googleEmail, name: googleName } = err.response.data.data;
        navigate('/customer/register', { state: { googleEmail, googleName } });
      } else {
        setError(err.response?.data?.error?.message || 'Google Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side */}
        <div className="md:w-1/2 bg-gradient-to-br from-brand-primary to-orange-600 p-12 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 text-white/10 rotate-12">
            <UtensilsCrossed className="w-48 h-48" />
          </div>
          
          <div className="relative z-10">
            <Link to="/" className="inline-block mb-12 hover:opacity-90 transition-opacity">
              <Logo size="lg" textColor="text-white" invert />
            </Link>
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Your next favorite meal is waiting.</h1>
            <p className="text-white/90 text-lg font-medium leading-relaxed max-w-sm">
              Discover restaurants, explore dishes and order what you're craving.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="md:w-1/2 p-8 md:p-12 relative">
          {(mode === 'otp' || mode === 'email') && (
            <button 
              onClick={() => { setMode('phone'); setError(''); setOtp(''); }}
              className="absolute top-6 left-6 text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1 text-sm font-bold"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}

          <div className="max-w-sm mx-auto mt-6">
            <h2 className="text-3xl font-bold text-brand-dark mb-2">
              {mode === 'email' ? 'Welcome back' : mode === 'otp' ? 'Verify OTP' : 'Login or Sign up'}
            </h2>
            <p className="text-gray-500 mb-8">
              {mode === 'email' ? 'Log in to your account using email' : mode === 'otp' ? `We've sent a 6-digit code to +91 ${phone}` : 'Enter your phone number to continue'}
            </p>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100">
                {String(error)}
              </div>
            )}

            {mode === 'phone' && (
              <>
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-medium">+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all font-medium text-lg tracking-wide"
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-primary/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {loading ? 'Sending OTP...' : 'Continue'}
                  </button>
                </form>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setMode('email')}
                    className="w-full bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold py-3.5 rounded-xl transition-colors border border-gray-200 flex items-center justify-center gap-2"
                  >
                    Continue with Email
                  </button>
                  <div className="flex justify-center mt-2">
                    <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Authentication Failed')} text="signin_with" />
                  </div>
                </div>
              </>
            )}

            {mode === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit OTP</label>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-4 text-center tracking-[0.5em] text-2xl font-bold rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                    placeholder="••••••"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-brand-primary/30 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                
                <div className="text-center mt-6">
                  <button
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={handleSendOtp}
                    className="text-sm font-bold text-brand-primary hover:text-brand-secondary disabled:text-gray-400 transition-colors"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}

            {mode === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-5">
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
                    <Link to="#" className="text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors">
                      Forgot?
                    </Link>
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
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
                
                <div className="mt-8 text-center text-sm text-gray-500">
                  Don't have an account?
                  <Link 
                    to="/customer/register"
                    className="ml-2 font-bold text-brand-primary hover:text-brand-secondary transition-colors"
                  >
                    Sign up
                  </Link>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
