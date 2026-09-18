import { useState } from 'react';
import api from '../../api/axios';
import { CheckCircle, ExternalLink, Loader2, MapPin, Navigation, Send, ShieldCheck } from 'lucide-react';

interface LocationSetupProps {
  profile: any;
  onSaved: () => Promise<void> | void;
  locationEndpoint?: string;
  requestEndpoint?: string;
}

interface LocationDraft {
  latitude: number;
  longitude: number;
  formatted_address: string;
  area: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  source: 'gps' | 'manual';
}

function addressFromNominatim(data: any, source: 'gps' | 'manual'): LocationDraft {
  const address = data.address || {};
  return {
    latitude: Number(data.lat),
    longitude: Number(data.lon),
    formatted_address: data.display_name || '',
    area: address.suburb || address.neighbourhood || address.road || '',
    city: address.city || address.town || address.village || address.municipality || '',
    district: address.county || address.state_district || '',
    state: address.state || '',
    pincode: address.postcode || '',
    source,
  };
}

export default function LocationSetup({ profile, onSaved, locationEndpoint = '/profile/location', requestEndpoint = '/profile/location/change-request' }: LocationSetupProps) {
  const [draft, setDraft] = useState<LocationDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [replacementMode, setReplacementMode] = useState(false);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const hasSavedLocation = Boolean(profile?.location_set_at);
  const latestRequest = profile?.location_change_requests?.[0];
  const approvedRequest = profile?.location_change_requests?.find((request: any) => request.status === 'approved');
  const mapUrl = draft
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${draft.longitude - 0.01}%2C${draft.latitude - 0.01}%2C${draft.longitude + 0.01}%2C${draft.latitude + 0.01}&layer=mapnik&marker=${draft.latitude}%2C${draft.longitude}`
    : profile?.latitude && profile?.longitude
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(profile.longitude) - 0.01}%2C${Number(profile.latitude) - 0.01}%2C${Number(profile.longitude) + 0.01}%2C${Number(profile.latitude) + 0.01}&layer=mapnik&marker=${profile.latitude}%2C${profile.longitude}`
      : '';

  const lookup = async (latitude: number, longitude: number, source: 'gps' | 'manual') => {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
      headers: { 'Accept-Language': 'en' },
    });
    if (!response.ok) throw new Error('Reverse geocoding failed');
    const data = await response.json();
    setDraft(addressFromNominatim({ ...data, lat: latitude, lon: longitude }, source));
  };

  const detectLocation = () => {
    setError('');
    setMessage('');
    if (!navigator.geolocation) {
      setError('This browser does not support location detection. Use manual address search instead.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          await lookup(position.coords.latitude, position.coords.longitude, 'gps');
        } catch {
          setError('Unable to detect the address. Please try again or enter it manually.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError('Location permission was denied or GPS is unavailable. Please enable permission or enter the address manually.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const searchManualAddress = async () => {
    if (!manualAddress.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(manualAddress)}`, {
        headers: { 'Accept-Language': 'en' },
      });
      const results = await response.json();
      if (!results[0]) throw new Error('Address not found');
      await lookup(Number(results[0].lat), Number(results[0].lon), 'manual');
    } catch {
      setError('We could not find that address. Try adding the city or pincode.');
    } finally {
      setLoading(false);
    }
  };

  const saveLocation = async () => {
    if (!draft) return;
    setLoading(true);
    setError('');
    try {
      await api.post(locationEndpoint, { ...draft, ...(approvedRequest && { request_id: approvedRequest.id }) });
      setDraft(null);
      setMessage('Restaurant location saved successfully. It is now locked.');
      await onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Unable to save restaurant location.');
    } finally {
      setLoading(false);
    }
  };

  const submitChangeRequest = async () => {
    if (!draft || !reason.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post(requestEndpoint, { ...draft, reason });
      setDraft(null);
      setReason('');
      setRequestOpen(false);
      setReplacementMode(false);
      setMessage('Location change request submitted for admin review.');
      await onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Unable to submit location change request.');
    } finally {
      setLoading(false);
    }
  };

  const detectedAddress = draft?.formatted_address.toLowerCase() || '';
  const mismatch = Boolean(draft && profile?.city && !detectedAddress.includes(String(profile.city).toLowerCase()));

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-primary" /> Restaurant Location</h2>
          <p className="text-sm text-gray-500 mt-1">Used for customer discovery, delivery distance, and order routing.</p>
        </div>
        {hasSavedLocation && <ShieldCheck className="w-6 h-6 text-green-600 shrink-0" />}
      </div>

      {message && <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-bold text-green-700">{message}</div>}
      {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

      {(draft || hasSavedLocation) && mapUrl && (
        <div className="mb-4 overflow-hidden rounded-xl border border-gray-200">
          <iframe title="Restaurant location map" src={mapUrl} className="w-full h-56 border-0" loading="lazy" />
        </div>
      )}

      {draft && (
        <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4 mb-4">
          <p className="font-black text-gray-900">Location Found</p>
          <p className="text-sm font-medium text-gray-700 mt-1"><MapPin className="w-4 h-4 inline mr-1 text-brand-primary" />{draft.formatted_address || `${draft.city}, ${draft.state}`}</p>
          <p className="text-xs text-gray-500 mt-2">{draft.area}, {draft.city}, {draft.district}, {draft.state} {draft.pincode}</p>
          {mismatch && <p className="mt-3 text-sm font-bold text-amber-700">Location does not appear to match the entered restaurant address. Please verify before saving.</p>}
          <div className="flex flex-wrap gap-3 mt-4">
            <button type="button" onClick={requestOpen ? submitChangeRequest : saveLocation} disabled={loading || (requestOpen && !reason.trim())} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"><CheckCircle className="w-4 h-4" /> {requestOpen ? 'Submit Change Request' : 'Confirm & Save'}</button>
            {hasSavedLocation && <button type="button" onClick={() => setDraft(null)} disabled={loading} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700">Cancel</button>}
          </div>
        </div>
      )}

      {!hasSavedLocation && !draft && (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={detectLocation} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-black text-white disabled:opacity-50"><Navigation className="w-4 h-4" /> {loading ? 'Detecting...' : 'Use Current Location'}</button>
          <button type="button" onClick={() => setManualOpen(!manualOpen)} className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700">Enter Address Manually</button>
        </div>
      )}

      {hasSavedLocation && !draft && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="font-black text-green-800 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Restaurant Location Verified</p>
          <p className="text-sm font-medium text-green-900 mt-2">{profile.formatted_address || `${profile.area || ''}, ${profile.city}, ${profile.state} ${profile.pincode || ''}`}</p>
          <p className="text-xs text-green-700 mt-2">Location locked. Saved on {new Date(profile.location_set_at).toLocaleString()}.</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <a href={`https://www.openstreetmap.org/?mlat=${profile.latitude}&mlon=${profile.longitude}#map=17/${profile.latitude}/${profile.longitude}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-green-300 px-4 py-2.5 text-sm font-bold text-green-800"><ExternalLink className="w-4 h-4" /> View on Map</a>
            {approvedRequest ? (
              <button type="button" onClick={() => { setReplacementMode(true); setManualOpen(true); setRequestOpen(false); }} className="inline-flex items-center gap-2 rounded-xl border border-green-300 px-4 py-2.5 text-sm font-bold text-green-800"><Navigation className="w-4 h-4" /> Set Approved New Location</button>
            ) : latestRequest?.status === 'pending' ? (
              <span className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700">Location change request under review</span>
            ) : (
              <button type="button" onClick={() => { setRequestOpen(true); setManualOpen(false); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700"><Send className="w-4 h-4" /> Request Location Change</button>
            )}
          </div>
        </div>
      )}

      {(manualOpen || requestOpen) && !draft && (
        <div className="mt-4 rounded-xl border border-gray-200 p-4">
          {requestOpen && <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Why does the restaurant location need to change?" className="w-full mb-3 rounded-xl border border-gray-200 p-3 text-sm" rows={3} />}
          <div className="flex gap-2">
            <input value={manualAddress} onChange={e => setManualAddress(e.target.value)} placeholder="Search restaurant address" className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm" />
            <button type="button" onClick={searchManualAddress} disabled={loading} className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}</button>
          </div>
          {requestOpen && <p className="text-xs text-gray-500 mt-2">The new location will remain pending until an admin approves this request.</p>}
          {replacementMode && <p className="text-xs text-green-700 mt-2">Admin approved this replacement. Find the new location, then confirm it.</p>}
        </div>
      )}
    </section>
  );
}
