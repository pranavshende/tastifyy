import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { Eye, EyeOff, UtensilsCrossed, Camera } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { GoogleLogin } from '@react-oauth/google';

export default function CustomerLogin() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const handleRedirect = (role: string) => {
    switch (role) {
      case 'customer':
        navigate('/customer/home');
        break;
      case 'restaurant_partner':
        navigate('/restaurant/dashboard');
        break;
      case 'delivery_partner':
        navigate('/delivery/dashboard');
        break;
      case 'admin':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (isRegister) {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        formData.append('name', name);
        formData.append('phone', phone);
        formData.append('role', 'customer');
        if (dob) formData.append('dob', dob);
        if (addressLine) formData.append('address_line', addressLine);
        if (city) formData.append('city', city);
        if (state) formData.append('state', state);
        if (pincode) formData.append('pincode', pincode);
        if (profilePhoto) formData.append('profile_photo', profilePhoto);

        res = await api.post('/auth/register', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/auth/login', { email, password });
      }
      const token = res.data.session?.access_token;
      if (!token || !res.data.user) throw new Error('Invalid response from server');
      setAuth(res.data.user, token);
      handleRedirect(res.data.user.role);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Authentication failed';
      setError(msg);
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
        setIsRegister(true);
        if (googleEmail) setEmail(googleEmail);
        if (googleName) setName(googleName);
        setError('Google account not registered. Please complete your profile to sign up.');
      } else {
        const msg = err.response?.data?.error?.message || err.response?.data?.error || err.message || 'Google Authentication failed';
        setError(msg);
      }
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

            <div className="mb-6 flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    setError('Google Authentication Failed');
                  }}
                  text={isRegister ? 'signup_with' : 'signin_with'}
                />
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegister && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden hover:border-brand-primary transition-colors group">
                      {profilePhoto ? (
                        <img 
                          src={URL.createObjectURL(profilePhoto)} 
                          alt="Profile Preview" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-gray-400 group-hover:text-brand-primary transition-colors" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={e => setProfilePhoto(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>
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
                  <div className="flex gap-4">
                    <div className="flex-1">
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
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={e => setDob(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Delivery Address</label>
                    <input
                      type="text"
                      value={addressLine}
                      onChange={e => setAddressLine(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all mb-3"
                      placeholder="Street address, apartment, suite, etc."
                    />
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={state}
                        onChange={e => setState(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="State"
                      />
                      <input
                        type="text"
                        value={pincode}
                        onChange={e => setPincode(e.target.value)}
                        className="w-24 px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all"
                        placeholder="PIN"
                      />
                    </div>
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
