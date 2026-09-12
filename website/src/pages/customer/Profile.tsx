import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { 
  User, Phone, Mail, Calendar, Camera, Loader2, Save, AlertCircle, Trash2,
  MapPin, Plus, Package, ChevronRight, Check, X
} from 'lucide-react';
import Header from '../../components/customer/Header';

function ImageUploadButton({
  label, currentUrl, onUpload, onDelete, uploading, aspect = 'square',
}: {
  label: string; currentUrl?: string | null; onUpload: (file: File) => void; onDelete: () => void; uploading?: boolean; aspect?: 'square' | 'cover';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };
  return (
    <div className={`relative group ${aspect === 'cover' ? 'w-full h-36' : 'w-24 h-24'} cursor-pointer`} onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
      {currentUrl ? (
        <img src={currentUrl} alt={label} className={`w-full h-full object-cover ${aspect === 'cover' ? 'rounded-xl' : 'rounded-full'}`} />
      ) : (
        <div className={`w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center ${aspect === 'cover' ? 'rounded-xl' : 'rounded-full'}`}>
          <Camera className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-[10px] text-gray-400 font-bold text-center px-1">{label}</span>
        </div>
      )}
      <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${aspect === 'cover' ? 'rounded-xl' : 'rounded-full'}`}>
        {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : (
          <>
            <Camera className="w-5 h-5 text-white mb-1" />
            <span className="text-[10px] text-white font-bold">Change</span>
          </>
        )}
      </div>
      {currentUrl && !uploading && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10 hover:bg-red-600"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function CustomerProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState('personal');

  const [profile, setProfile] = useState({
    name: '', phone: '', email: '', dob: '', profile_photo_url: null as string | null
  });

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  
  // New Address Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: 'Home', address_line: '', city: '', state: '', pincode: '', is_default: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, addrRes] = await Promise.all([
        api.get('/customer/profile'),
        api.get('/customer/addresses')
      ]);
      const data = profileRes.data.data;
      setProfile({
        name: data.name || '', phone: data.phone || '', email: data.email || '',
        dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
        profile_photo_url: data.profile_photo_url
      });
      setAddresses(addrRes.data.data || []);
    } catch (err) {
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null); setSuccess(null); setSaving(true);
    try {
      await api.put('/customer/profile', {
        name: profile.name, phone: profile.phone, email: profile.email, dob: profile.dob || null
      });
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setError(null); setUploadingPhoto(true);
    try {
      const formData = new FormData(); formData.append('image', file);
      const res = await api.post('/customer/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setProfile(prev => ({ ...prev, profile_photo_url: res.data.data.profile_photo_url }));
      setSuccess('Photo uploaded successfully');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?')) return;
    setError(null); setUploadingPhoto(true);
    try {
      await api.delete('/customer/profile/photo');
      setProfile(prev => ({ ...prev, profile_photo_url: null }));
      setSuccess('Photo removed successfully');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to remove photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setLoadingAddresses(true);
    try {
      await api.post('/customer/addresses', newAddress);
      setSuccess('Address added successfully');
      setShowAddForm(false);
      setNewAddress({ label: 'Home', address_line: '', city: '', state: '', pincode: '', is_default: false });
      
      const res = await api.get('/customer/addresses');
      setAddresses(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to add address');
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/customer/addresses/${id}`);
      setAddresses(addresses.filter(a => a.id !== id));
      setSuccess('Address deleted');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    try {
      await api.patch(`/customer/addresses/${id}/default`);
      // Update local state: mark this as default, unmark others
      setAddresses(addresses.map(a => ({ ...a, is_default: a.id === id })));
      setSuccess('Default address updated');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to set default address');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showSearch={false} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light flex flex-col font-sans text-brand-dark pb-20">
      <Header showSearch={false} />
      
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">My Account</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your information, addresses, and view orders.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 border border-red-100">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-bold text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl flex items-center gap-3 border border-green-100">
            <Check className="w-5 h-5 shrink-0" />
            <p className="font-bold text-sm">{success}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR NAVIGATION */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-2">
              <button 
                onClick={() => setActiveTab('personal')}
                className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold transition-all text-left ${activeTab === 'personal' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-600 hover:bg-orange-50 hover:text-brand-primary'}`}
              >
                <User className="w-5 h-5" />
                Personal Info
              </button>
              
              <button 
                onClick={() => setActiveTab('addresses')}
                className={`flex items-center gap-3 w-full p-4 rounded-2xl font-bold transition-all text-left ${activeTab === 'addresses' ? 'bg-brand-primary text-white shadow-md' : 'text-gray-600 hover:bg-orange-50 hover:text-brand-primary'}`}
              >
                <MapPin className="w-5 h-5" />
                Saved Addresses
              </button>
              
              <Link to="/customer/orders" className="flex items-center gap-3 w-full p-4 rounded-2xl font-bold transition-all text-left text-gray-600 hover:bg-orange-50 hover:text-brand-primary">
                <Package className="w-5 h-5" />
                My Orders
                <ChevronRight className="w-5 h-5 ml-auto opacity-50" />
              </Link>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 min-h-[500px]">
            
            {/* --- PERSONAL INFO TAB --- */}
            {activeTab === 'personal' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Personal Information</h2>
                
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex flex-col items-center">
                    <ImageUploadButton
                      label="Avatar"
                      currentUrl={profile.profile_photo_url}
                      onUpload={handlePhotoUpload}
                      onDelete={handlePhotoDelete}
                      uploading={uploadingPhoto}
                    />
                  </div>

                  <div className="flex-1 w-full space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Full Name</label>
                        <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> Phone Number</label>
                        <input type="text" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> Email Address</label>
                        <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Date of Birth</label>
                        <input type="date" value={profile.dob} onChange={e => setProfile({...profile, dob: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all" />
                      </div>
                    </div>
                    <div className="pt-6 flex justify-end">
                      <button onClick={handleSave} disabled={saving || !profile.name || !profile.phone} className="flex items-center gap-2 bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-brand-secondary transition-colors shadow-sm disabled:opacity-50">
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- SAVED ADDRESSES TAB --- */}
            {activeTab === 'addresses' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h2 className="text-xl font-bold text-gray-900">Saved Addresses</h2>
                  {!showAddForm && (
                    <button onClick={() => setShowAddForm(true)} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-black transition-colors">
                      <Plus className="w-4 h-4" /> Add New
                    </button>
                  )}
                </div>

                {showAddForm ? (
                  <form onSubmit={handleAddAddress} className="bg-orange-50/50 rounded-2xl p-6 border border-brand-primary/20 mb-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-brand-dark">Add New Address</h3>
                      <button type="button" onClick={() => setShowAddForm(false)} className="p-1 hover:bg-orange-100 rounded-lg text-gray-500"><X className="w-5 h-5"/></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Label</label>
                        <select value={newAddress.label} onChange={e => setNewAddress({...newAddress, label: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 font-medium text-gray-900 focus:outline-none focus:border-brand-primary">
                          <option value="Home">Home</option>
                          <option value="Work">Work</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 mb-1">Address Line</label>
                        <input required type="text" value={newAddress.address_line} onChange={e => setNewAddress({...newAddress, address_line: e.target.value})} placeholder="Flat, House no., Building, Company, Apartment" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 font-medium text-gray-900 focus:outline-none focus:border-brand-primary" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">City</label>
                        <input required type="text" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 font-medium text-gray-900 focus:outline-none focus:border-brand-primary" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
                        <input required type="text" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 font-medium text-gray-900 focus:outline-none focus:border-brand-primary" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Pincode</label>
                        <input required type="text" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 font-medium text-gray-900 focus:outline-none focus:border-brand-primary" />
                      </div>
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer pt-6">
                          <input type="checkbox" checked={newAddress.is_default} onChange={e => setNewAddress({...newAddress, is_default: e.target.checked})} className="w-5 h-5 text-brand-primary rounded border-gray-300 focus:ring-brand-primary" />
                          <span className="font-bold text-gray-700 text-sm">Make Default</span>
                        </label>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                      <button type="button" onClick={() => setShowAddForm(false)} className="px-6 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
                      <button type="submit" disabled={loadingAddresses} className="bg-brand-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-secondary transition-colors flex items-center gap-2 disabled:opacity-50">
                        {loadingAddresses && <Loader2 className="w-4 h-4 animate-spin" />} Save Address
                      </button>
                    </div>
                  </form>
                ) : null}

                {addresses.length === 0 && !showAddForm ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-gray-900">No Saved Addresses</h3>
                    <p className="text-gray-500 font-medium mt-1 mb-4">Add an address so you can order food to your location.</p>
                    <button onClick={() => setShowAddForm(true)} className="bg-brand-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-secondary transition-colors inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div key={address.id} className={`p-4 rounded-2xl border-2 transition-all group relative ${address.is_default ? 'border-brand-primary bg-orange-50/20' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded uppercase text-xs tracking-wider">
                              {address.label}
                            </span>
                            {address.is_default && (
                              <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded uppercase tracking-wider">Default</span>
                            )}
                          </div>
                          <button onClick={() => handleDeleteAddress(address.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-gray-600 font-medium text-sm leading-relaxed pr-6 mb-3">
                          {address.address_line}, {address.city}, {address.state} - {address.pincode}
                        </p>
                        {!address.is_default && (
                          <div className="flex justify-start">
                            <button 
                              onClick={() => handleSetDefaultAddress(address.id)}
                              className="text-xs font-bold text-brand-primary hover:text-brand-secondary bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Set as Default
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </main>
    </div>
  );
}
