import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { User, Phone, Mail, Calendar, Camera, Loader2, Save, AlertCircle, Trash2 } from 'lucide-react';
import Header from '../../components/customer/Header';

function ImageUploadButton({
  label,
  currentUrl,
  onUpload,
  onDelete,
  uploading,
  aspect = 'square',
}: {
  label: string;
  currentUrl?: string | null;
  onUpload: (file: File) => void;
  onDelete: () => void;
  uploading?: boolean;
  aspect?: 'square' | 'cover';
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  return (
    <div className={`relative group ${aspect === 'cover' ? 'w-full h-36' : 'w-24 h-24'} cursor-pointer`}
         onClick={() => inputRef.current?.click()}>
      <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
             className="hidden" onChange={handleFileChange} />

      {currentUrl ? (
        <img src={currentUrl} alt={label}
             className={`w-full h-full object-cover ${aspect === 'cover' ? 'rounded-xl' : 'rounded-full'}`} />
      ) : (
        <div className={`w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center ${aspect === 'cover' ? 'rounded-xl' : 'rounded-full'}`}>
          <Camera className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-[10px] text-gray-400 font-bold text-center px-1">{label}</span>
        </div>
      )}

      {/* Hover overlay */}
      <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${aspect === 'cover' ? 'rounded-xl' : 'rounded-full'}`}>
        {uploading ? (
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        ) : (
          <>
            <Camera className="w-5 h-5 text-white mb-1" />
            <span className="text-[10px] text-white font-bold">Change</span>
          </>
        )}
      </div>

      {/* Delete button */}
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
  
  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    email: '',
    dob: '',
    profile_photo_url: null as string | null
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/customer/profile');
      const data = res.data.data;
      setProfile({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
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
      await api.put('/customer/profile', {
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        dob: profile.dob || null
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
      const res = await api.post('/customer/profile/photo', formData, {
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
      await api.delete('/customer/profile/photo');
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
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header showSearch={false} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Header showSearch={false} />
      
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900">My Profile</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your personal information and preferences</p>
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
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center">
              <ImageUploadButton
                label="Avatar"
                currentUrl={profile.profile_photo_url}
                onUpload={handlePhotoUpload}
                onDelete={handlePhotoDelete}
                uploading={uploadingPhoto}
              />
            </div>

            {/* Form Section */}
            <div className="flex-1 w-full space-y-6">
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

                <div>
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

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profile.dob}
                    onChange={e => setProfile({...profile, dob: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                  />
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
      </main>
    </div>
  );
}
