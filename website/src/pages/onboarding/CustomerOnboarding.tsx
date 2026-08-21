import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';
import { CheckCircle, Navigation, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CustomerOnboarding() {
  const { user, initAuth } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [step, setStep] = useState(1);
  const [preference, setPreference] = useState<'veg' | 'non-veg' | 'both'>('both');
  
  const [address, setAddress] = useState({
    house: '',
    street: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleUseLocation = () => {
    // Mocking geolocation for MVP
    setAddress({
      house: '',
      street: 'Linking Road',
      area: 'Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await api.patch('/onboarding/customer', {
        preferences: preference,
        address: {
          label: 'home',
          address_line: `${address.house} ${address.street}, ${address.area}`.trim(),
          city: address.city,
          state: address.state,
          pincode: address.pincode,
          latitude: 0,
          longitude: 0,
        }
      });
      await initAuth();
      setStep(3); // Success step
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update profile');
      setStep(2); // Keep them on the form if it fails
    } finally {
      setLoading(false);
    }
  };

  const isAddressComplete = address.street && address.city && address.state && address.pincode;

  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
        
        {/* Progress Bar */}
        {step < 3 && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100">
            <div 
              className="h-full bg-brand-primary transition-all duration-500 ease-out"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        )}

        {/* STEP 1: PREFERENCES */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <h1 className="text-3xl font-black text-brand-dark mb-2">Let's get to know you</h1>
            <p className="text-gray-500 mb-8 font-medium">Hi {user?.name?.split(' ')[0] || 'there'}! What kind of food do you usually prefer?</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                { id: 'veg', label: 'Vegetarian', color: 'bg-green-50 border-green-200 text-green-700', icon: '🥬' },
                { id: 'non-veg', label: 'Non-Vegetarian', color: 'bg-red-50 border-red-200 text-red-700', icon: '🍗' },
                { id: 'both', label: 'Both', color: 'bg-orange-50 border-orange-200 text-orange-700', icon: '🍽️' }
              ].map((pref) => (
                <button
                  key={pref.id}
                  onClick={() => setPreference(pref.id as any)}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 hover:-translate-y-1 ${
                    preference === pref.id 
                      ? `${pref.color} shadow-md` 
                      : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <span className="text-4xl">{pref.icon}</span>
                  <span className="font-bold">{pref.label}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setStep(2)}
                className="bg-brand-dark hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: ADDRESS */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1 font-bold text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-black text-brand-dark mb-2">Where should we deliver?</h1>
            <p className="text-gray-500 mb-6 font-medium">Enter your primary delivery address.</p>

            <button 
              onClick={handleUseLocation}
              className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 font-bold py-4 rounded-xl mb-6 hover:bg-blue-100 transition-colors border border-blue-100"
            >
              <Navigation className="w-5 h-5" />
              Use my current location
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-100"></div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">OR ENTER MANUALLY</span>
              <div className="flex-1 h-px bg-gray-100"></div>
            </div>

            {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 font-medium text-sm">{error}</div>}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">House / Flat</label>
                  <input type="text" name="house" value={address.house} onChange={handleAddressChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-brand-primary focus:bg-white outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Area</label>
                  <input type="text" name="area" value={address.area} onChange={handleAddressChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-brand-primary focus:bg-white outline-none transition-all font-medium" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street</label>
                <input type="text" name="street" value={address.street} onChange={handleAddressChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-brand-primary focus:bg-white outline-none transition-all font-medium" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                  <input type="text" name="city" value={address.city} onChange={handleAddressChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-brand-primary focus:bg-white outline-none transition-all font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pincode</label>
                  <input type="text" name="pincode" value={address.pincode} onChange={handleAddressChange} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:border-brand-primary focus:bg-white outline-none transition-all font-medium" />
                </div>
              </div>
              
              <div className="hidden">
                 <input type="text" name="state" value={address.state} onChange={handleAddressChange} />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !isAddressComplete}
              className="w-full mt-8 bg-brand-primary hover:bg-brand-secondary text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-primary/30 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Saving Profile...' : 'Complete Setup'}
            </button>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 3 && (
          <div className="text-center animate-fade-in-up py-8">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">You're all set!</h1>
            <p className="text-gray-500 mb-8 font-medium max-w-sm mx-auto">
              Your profile is ready. We'll show you the best food available around <span className="font-bold text-gray-800">{address.area || address.city}</span>.
            </p>
            
            <button 
              onClick={() => navigate('/customer/home')}
              className="bg-brand-dark hover:bg-black text-white px-10 py-4 rounded-xl font-bold transition-all shadow-md inline-flex items-center gap-2"
            >
              Start Exploring <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="mt-8 flex justify-center items-center gap-2 text-brand-primary font-bold">
              <div className="w-2 h-2 rounded-full bg-brand-primary"></div>
              <div className="w-4 h-1 rounded-full bg-brand-primary"></div>
              <div className="w-8 h-2 rounded-full bg-brand-primary"></div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
