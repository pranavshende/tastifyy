import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { User, Phone, Mail, Truck, Save, Loader2, AlertCircle, Hash, Building2 } from 'lucide-react';
import { ImageUploadButton } from '../../components/ui/ImageUploadButton';

export default function DeliveryProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    vehicle_type: '',
    vehicle_number: '',
    bank_account_number: '',
    ifsc_code: '',
    upi_id: '',
    profile_photo_url: null as string | null
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/delivery/profile');
      const data = res.data.data;
      setProfile({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        vehicle_type: data.vehicle_type || '',
        vehicle_number: data.vehicle_number || '',
        bank_account_number: data.bank_account_number || '',
        ifsc_code: data.ifsc_code || '',
        upi_id: data.upi_id || '',
        profile_photo_url: data.profile_photo_url
      });
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await api.put('/delivery/profile', {
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        vehicle_type: profile.vehicle_type,
        vehicle_number: profile.vehicle_number,
        bank_account_number: profile.bank_account_number,
        ifsc_code: profile.ifsc_code,
        upi_id: profile.upi_id
      });
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setError(null);
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/delivery/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
    setError(null);
    setUploadingPhoto(true);
    try {
      await api.delete('/delivery/profile/photo');
      setProfile(prev => ({ ...prev, profile_photo_url: null }));
      setSuccess('Photo removed successfully');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to remove photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Delivery Profile</h1>
        <p className="text-gray-500 font-medium mt-1">Manage your details, vehicle, and payouts</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex items-center gap-3 border border-red-100">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl flex items-center gap-3 border border-green-100">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-bold text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
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

          <div className="flex-1 w-full space-y-8">
            {/* Personal Details */}
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={e => setProfile({...profile, phone: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={e => setProfile({...profile, email: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Vehicle Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    Vehicle Type
                  </label>
                  <select
                    value={profile.vehicle_type}
                    onChange={e => setProfile({...profile, vehicle_type: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  >
                    <option value="">Select Type</option>
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="bicycle">Bicycle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-gray-400" />
                    Vehicle Number
                  </label>
                  <input
                    type="text"
                    value={profile.vehicle_number}
                    onChange={e => setProfile({...profile, vehicle_number: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent uppercase transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-4 pb-2 border-b border-gray-100">Payout Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    value={profile.bank_account_number}
                    onChange={e => setProfile({...profile, bank_account_number: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={profile.ifsc_code}
                    onChange={e => setProfile({...profile, ifsc_code: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent uppercase transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    UPI ID
                  </label>
                  <input
                    type="text"
                    value={profile.upi_id}
                    onChange={e => setProfile({...profile, upi_id: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !profile.name || !profile.phone}
                className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-secondary transition-colors disabled:opacity-50 shadow-sm"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
