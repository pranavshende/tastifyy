import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Store, CheckCircle, XCircle, MapPin, Phone, Award, Key } from 'lucide-react';

export default function RestaurantProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Local state for the "open" toggle
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/menu/info');
        if (data.success) {
          setProfile(data.data.restaurant);
          setIsOpen(data.data.restaurant.is_open);
        } else {
          setError('Failed to fetch profile');
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleToggleOpen = () => {
    // In a real app, this would call an API: api.patch('/restaurant/status', { is_open: !isOpen })
    // For MVP, we'll optimistically update the UI
    setIsOpen(!isOpen);
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl font-bold border border-red-100">
          {error || 'Failed to load restaurant profile'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="max-w-4xl mx-auto w-full">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4 shrink-0">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Restaurant Profile</h1>
              <p className="text-gray-500 font-medium text-sm mt-0.5">Manage your business identity and store status</p>
            </div>
            
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold border shadow-sm ${
              profile.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
              profile.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}>
              {profile.status === 'active' ? <CheckCircle className="w-5 h-5 mr-1" /> : <XCircle className="w-5 h-5 mr-1" />}
              {profile.status?.toUpperCase()} ACCOUNT
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative mb-6">
            {/* Cover Image */}
            <div className="h-40 bg-gray-900 relative">
              <div className="absolute inset-0 bg-brand-primary/20 backdrop-blur-[2px]"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
              
              {/* Quick Toggle Over Cover */}
              <div className="absolute top-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4">
                <div className="text-white font-bold text-sm">
                  {isOpen ? '🟢 Accepting Orders' : '🔴 Store Closed'}
                </div>
                <label className="flex items-center cursor-pointer relative">
                  <input type="checkbox" className="sr-only" checked={isOpen} onChange={handleToggleOpen} />
                  <div className={`w-14 h-8 rounded-full transition-colors ${isOpen ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <div className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${isOpen ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </label>
              </div>
            </div>

            <div className="px-6 pb-8 relative">
              {/* Profile Avatar */}
              <div className="w-24 h-24 bg-white rounded-xl shadow-lg border-4 border-white absolute -top-12 flex items-center justify-center text-4xl font-black text-brand-primary overflow-hidden">
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  profile.name?.charAt(0) || 'R'
                )}
              </div>
              
              <div className="mt-16">
                <h2 className="text-2xl font-black text-gray-900 mb-2">{profile.name}</h2>
                <div className="flex items-center gap-3 text-sm font-medium text-gray-500 mb-8">
                  <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" /> {profile.city || 'Location not set'}</span>
                  <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                  <span className="flex items-center"><Key className="w-4 h-4 mr-1" /> ID: <code className="ml-1 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{profile.id?.split('-')[0].toUpperCase()}</code></span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Business Details */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                      <Store className="w-5 h-5 mr-2 text-brand-primary" />
                      Business Information
                    </h3>
                    
                    <div className="space-y-5">
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Restaurant Name</div>
                        <div className="font-semibold text-gray-900">{profile.name}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cuisine Type</div>
                        <div className="font-semibold text-gray-900">{profile.type || 'Not specified'}</div>
                      </div>
                      {profile.is_pure_veg !== undefined && (
                        <div>
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Dietary Focus</div>
                          <div className={`font-semibold ${profile.is_pure_veg ? 'text-green-600' : 'text-gray-900'}`}>
                            {profile.is_pure_veg ? 'Pure Vegetarian 🌿' : 'Serves Non-Veg'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                      <Phone className="w-5 h-5 mr-2 text-brand-primary" />
                      Contact Information
                    </h3>
                    
                    <div className="space-y-5">
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Phone Number</div>
                        <div className="font-semibold text-gray-900">{profile.phone || '+91 9876543210 (Mock)'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</div>
                        <div className="font-semibold text-gray-900">{profile.email || 'contact@restaurant.com (Mock)'}</div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Registered Address</div>
                        <div className="font-semibold text-gray-900 leading-relaxed">
                          {profile.address_line || '123 Tastifyy Partner Lane'}<br />
                          {profile.city || 'Food City'}, {profile.pincode || '400001'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
                
                {/* Support Banner */}
                <div className="mt-6 bg-brand-primary/5 border border-brand-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-3 rounded-xl text-brand-primary shadow-sm shrink-0">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-brand-dark">Need to update your details?</h4>
                      <p className="text-sm font-medium text-brand-dark/70 mt-1">To change core business information, contact Tastifyy Support.</p>
                    </div>
                  </div>
                  <button className="bg-white text-brand-primary font-bold px-6 py-3 rounded-xl shadow-sm border border-brand-primary/20 hover:bg-gray-50 transition-colors w-full sm:w-auto whitespace-nowrap">
                    Contact Support
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
