import { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { getStorageUrl } from '../../lib/supabase';
import {
  Store, Phone, MapPin, Clock, Award, CheckCircle, XCircle,
  Camera, Loader2, Save, ChevronDown, ChevronUp, AlertCircle, Trash2
} from 'lucide-react';

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
];

const defaultHours = DAYS.map(d => ({ day_of_week: d.key, open_time: '10:00', close_time: '23:00', is_closed: false }));

function formatTimeFromDB(dateStr: string | null | undefined): string {
  if (!dateStr) return '10:00';
  // DB returns time as ISO date string like "1970-01-01T10:00:00.000Z"
  try {
    const d = new Date(dateStr);
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  } catch {
    return '10:00';
  }
}

// ─── Image Upload Button ──────────────────────────────────────────────────────

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
             className={`w-full h-full object-cover ${aspect === 'cover' ? 'rounded-xl' : 'rounded-2xl'}`} />
      ) : (
        <div className={`w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center ${aspect === 'cover' ? 'rounded-xl' : 'rounded-2xl'}`}>
          <Camera className="w-6 h-6 text-gray-400 mb-1" />
          <span className="text-[10px] text-gray-400 font-bold text-center px-1">{label}</span>
        </div>
      )}

      {/* Hover overlay */}
      <div className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${aspect === 'cover' ? 'rounded-xl' : 'rounded-2xl'}`}>
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
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10 hover:bg-red-600"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RestaurantProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showHours, setShowHours] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    cuisine_tags: '',
    type: 'restaurant',
    is_pure_veg: false,
    avg_preparation_time_mins: '',
    service_radius_km: '',
    is_open: false,
  });
  const [hours, setHours] = useState(defaultHours);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/profile');
      if (data.success) {
        const r = data.data;
        setProfile(r);
        setForm({
          name: r.name || '',
          phone: r.phone || '',
          email: r.email || '',
          address_line: r.address_line || '',
          city: r.city || '',
          state: r.state || '',
          pincode: r.pincode || '',
          cuisine_tags: (r.cuisine_tags || []).join(', '),
          type: r.type || 'restaurant',
          is_pure_veg: r.is_pure_veg || false,
          avg_preparation_time_mins: r.avg_preparation_time_mins?.toString() || '',
          service_radius_km: r.service_radius_km?.toString() || '',
          is_open: r.is_open || false,
        });

        if (r.operating_hours?.length > 0) {
          const dbHours = DAYS.map(d => {
            const h = r.operating_hours.find((oh: any) => oh.day_of_week === d.key);
            return h
              ? { day_of_week: d.key, open_time: formatTimeFromDB(h.open_time), close_time: formatTimeFromDB(h.close_time), is_closed: h.is_closed }
              : { day_of_week: d.key, open_time: '10:00', close_time: '23:00', is_closed: false };
          });
          setHours(dbHours);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    setError('');
    try {
      await api.put('/profile', {
        ...form,
        cuisine_tags: form.cuisine_tags.split(',').map(s => s.trim()).filter(Boolean),
        avg_preparation_time_mins: form.avg_preparation_time_mins || undefined,
        service_radius_km: form.service_radius_km || undefined,
      });

      // Save operating hours
      await api.put('/profile/hours', { hours });

      setSaveSuccess(true);
      await fetchProfile();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setUploadingLogo(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/profile/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) {
        setProfile((prev: any) => ({ ...prev, logo_url: data.data.logo_url }));
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoDelete = async () => {
    setUploadingLogo(true);
    try {
      await api.delete('/profile/logo');
      setProfile((prev: any) => ({ ...prev, logo_url: null }));
    } catch {
      setUploadError('Failed to delete logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await api.post('/profile/cover', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) {
        setProfile((prev: any) => ({ ...prev, cover_image_url: data.data.cover_image_url }));
      }
    } catch (err: any) {
      setUploadError(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCoverDelete = async () => {
    setUploadingCover(true);
    try {
      await api.delete('/profile/cover');
      setProfile((prev: any) => ({ ...prev, cover_image_url: null }));
    } catch {
      setUploadError('Failed to delete cover');
    } finally {
      setUploadingCover(false);
    }
  };

  const toggleAcceptingOrders = async () => {
    const newVal = !form.is_open;
    setForm(f => ({ ...f, is_open: newVal }));
    try {
      await api.patch('/profile/accepting-orders', { is_open: newVal });
    } catch {
      setForm(f => ({ ...f, is_open: !newVal }));
    }
  };

  const updateHour = (idx: number, field: string, value: string | boolean) => {
    setHours(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl font-bold border border-red-100 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" /> {error}
        </div>
      </div>
    );
  }

  const logoUrl = getStorageUrl(profile?.logo_url);
  const coverUrl = getStorageUrl(profile?.cover_image_url);

  return (
    <div className="flex flex-col overflow-y-auto scrollbar-hide pb-10">
      <div className="max-w-3xl mx-auto w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Restaurant Profile</h1>
            <p className="text-gray-500 font-medium text-sm mt-0.5">Manage your business information and preferences</p>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-sm font-bold border shadow-sm bg-white ${
            profile?.status === 'active' ? 'text-green-600 border-green-200' :
            profile?.status === 'pending' ? 'text-yellow-600 border-yellow-200' :
            'text-red-600 border-red-200'
          }`}>
            {profile?.status === 'active' ? <CheckCircle className="w-4 h-4 mr-1" /> : <XCircle className="w-4 h-4 mr-1" />}
            {profile?.status === 'active' ? 'Active Account' : `${profile?.status?.toUpperCase()} ACCOUNT`}
          </div>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {uploadError}
            <button onClick={() => setUploadError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* ── Images Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="relative h-44 bg-gray-100">
            {coverUrl ? (
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Camera className="w-10 h-10 text-gray-300" />
              </div>
            )}
            {/* Cover upload overlay */}
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all flex items-center justify-center group cursor-pointer"
                 onClick={() => document.getElementById('cover-upload-input')?.click()}>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center">
                {uploadingCover ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                    <span className="text-sm text-white font-bold mt-1 drop-shadow-lg">Upload Cover Photo</span>
                  </>
                )}
              </div>
              <input id="cover-upload-input" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                     onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f); e.target.value = ''; }} />
            </div>
            {/* Delete cover */}
            {coverUrl && (
              <button onClick={handleCoverDelete}
                      className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center hover:bg-red-600 transition-colors shadow">
                <Trash2 className="w-3 h-3 mr-1" /> Remove Cover
              </button>
            )}
          </div>

          <div className="px-6 pb-6 pt-0 relative">
            {/* Profile Logo — overlaps cover */}
            <div className="absolute -top-12 left-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-2xl shadow-md border-4 border-white overflow-hidden bg-gray-100 flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-black text-brand-primary">{form.name?.charAt(0) || 'R'}</span>
                  )}
                </div>
                <button
                  onClick={() => document.getElementById('logo-upload-input')?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-brand-secondary transition-colors"
                >
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input id="logo-upload-input" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden"
                       onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ''; }} />
              </div>
            </div>

            <div className="mt-16">
              <h2 className="text-xl font-black text-gray-900">{profile?.name}</h2>
              <div className="flex items-center gap-3 text-sm font-medium text-gray-500 mt-1">
                <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {profile?.city || 'Location not set'}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">ID: {profile?.id?.split('-')[0].toUpperCase()}</span>
              </div>

              {/* Accepting orders toggle */}
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm font-bold text-gray-700">Accepting Orders</span>
                <button
                  onClick={toggleAcceptingOrders}
                  className={`relative inline-flex w-12 h-6 rounded-full transition-colors ${form.is_open ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${form.is_open ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
                <span className={`text-sm font-bold ${form.is_open ? 'text-green-600' : 'text-gray-400'}`}>
                  {form.is_open ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Editable Info ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

          {/* Business Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center text-sm">
              <Store className="w-4 h-4 mr-2 text-brand-primary" /> Business Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Restaurant Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                       className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Cuisine Type</label>
                <input value={form.cuisine_tags} onChange={e => setForm(f => ({ ...f, cuisine_tags: e.target.value }))}
                       placeholder="North Indian, Chinese, Fast Food"
                       className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary" />
                <p className="text-[10px] text-gray-400 mt-1">Comma separated</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Restaurant Category</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary bg-white">
                  <option value="restaurant">Restaurant</option>
                  <option value="cloud_kitchen">Cloud Kitchen</option>
                  <option value="home_kitchen">Home Kitchen</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="pure-veg" checked={form.is_pure_veg}
                       onChange={e => setForm(f => ({ ...f, is_pure_veg: e.target.checked }))}
                       className="w-4 h-4 rounded accent-brand-primary" />
                <label htmlFor="pure-veg" className="text-sm font-bold text-gray-700">Pure Vegetarian Restaurant</label>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center text-sm">
              <Phone className="w-4 h-4 mr-2 text-brand-primary" /> Contact Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Phone Number</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                       className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                       className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Address</label>
                <input value={form.address_line} onChange={e => setForm(f => ({ ...f, address_line: e.target.value }))}
                       className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary mb-2" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                         placeholder="City"
                         className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary" />
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                         placeholder="State"
                         className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary" />
                </div>
                <input value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))}
                       placeholder="Pincode" className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary" />
              </div>
            </div>
          </div>

          {/* Business Settings */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-5 flex items-center text-sm">
              <MapPin className="w-4 h-4 mr-2 text-brand-primary" /> Business Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Avg Preparation Time (mins)</label>
                <input type="number" value={form.avg_preparation_time_mins}
                       onChange={e => setForm(f => ({ ...f, avg_preparation_time_mins: e.target.value }))}
                       className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Delivery Radius (km)</label>
                <input type="number" step="0.1" value={form.service_radius_km}
                       onChange={e => setForm(f => ({ ...f, service_radius_km: e.target.value }))}
                       className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-primary" />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <button
              onClick={() => setShowHours(!showHours)}
              className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-bold text-gray-900 flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-brand-primary" /> Operating Hours
              </h3>
              {showHours ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {showHours && (
              <div className="px-6 pb-6 space-y-3 border-t border-gray-100">
                {DAYS.map((day, idx) => (
                  <div key={day.key} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-500 w-10 shrink-0">{day.label.substring(0, 3).toUpperCase()}</span>
                    <input
                      type="checkbox"
                      checked={!hours[idx]?.is_closed}
                      onChange={e => updateHour(idx, 'is_closed', !e.target.checked)}
                      className="accent-brand-primary"
                    />
                    {!hours[idx]?.is_closed ? (
                      <>
                        <input type="time" value={hours[idx]?.open_time || '10:00'}
                               onChange={e => updateHour(idx, 'open_time', e.target.value)}
                               className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:border-brand-primary" />
                        <span className="text-gray-400 text-xs">—</span>
                        <input type="time" value={hours[idx]?.close_time || '23:00'}
                               onChange={e => updateHour(idx, 'close_time', e.target.value)}
                               className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-medium focus:outline-none focus:border-brand-primary" />
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Error + Save ── */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {error}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center">
            <CheckCircle className="w-4 h-4 mr-2" /> Profile saved successfully!
          </div>
        )}

        {/* Support Banner */}
        <div className="mt-2 bg-[#FEF4E8] border border-orange-100 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#FCD8BB] p-3 rounded-lg text-brand-primary shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Need to update your details?</h4>
              <p className="text-xs font-medium text-gray-500 mt-0.5">To change core business information, contact Tastifyy Support.</p>
            </div>
          </div>
          <button className="bg-white text-brand-primary font-bold px-5 py-2.5 rounded-lg shadow-sm border border-brand-primary hover:bg-orange-50 transition-colors w-full sm:w-auto whitespace-nowrap text-sm">
            Contact Support
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold text-base flex items-center justify-center hover:bg-brand-secondary transition-colors shadow-sm disabled:opacity-60"
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving Changes...</>
          ) : (
            <><Save className="w-5 h-5 mr-2" /> Save Changes</>
          )}
        </button>

      </div>
    </div>
  );
}
