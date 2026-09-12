import React, { useState } from 'react';
import { X, MapPin, Search, Target } from 'lucide-react';
import { useLocationStore, DELIVERY_ZONES } from '../../store/locationStore';
import type { City } from '../../store/locationStore';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationModal({ isOpen, onClose }: LocationModalProps) {
  const { city, selectedZone, setCity, setZone } = useLocationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  if (!isOpen) return null;

  const handleZoneSelect = (zoneId: string) => {
    const zone = DELIVERY_ZONES.find(z => z.id === zoneId);
    if (zone) {
      setZone(zone);
      onClose();
    }
  };

  const filteredZones = DELIVERY_ZONES.filter(z => 
    z.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const CITIES: City[] = ['Sakoli'];

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          
          let locationName = 'Detected Location';
          if (data && data.address) {
            locationName = data.address.suburb || data.address.neighbourhood || data.address.road || data.address.city || 'Detected Location';
          }

          setZone({
            id: 'gps',
            name: locationName,
            deliveryTime: '20-30 mins',
            baseFee: 35
          });
          onClose();
        } catch (error) {
          console.error('Error fetching location:', error);
          alert('Failed to detect location address.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        alert('Failed to get your location. Please ensure location permissions are granted.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-start pt-[10vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg relative flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div className="flex gap-3">
            <div className="mt-1 text-[#F23F5D]">
              <MapPin className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">Select Delivery Location</h2>
              <p className="text-sm text-gray-500 font-medium mt-0.5">Pick your city & active service zone</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto overflow-x-hidden scrollbar-hide flex-1">
          
          {/* GPS Button */}
          <button 
            onClick={handleGPSLocation}
            disabled={isLocating}
            className={`w-full flex items-center justify-between p-4 mb-6 border border-[#23C16B]/30 bg-[#23C16B]/5 hover:bg-[#23C16B]/10 rounded-2xl transition-colors border-dashed ${isLocating ? 'opacity-70' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="text-[#23C16B]">
                <Target className={`w-6 h-6 ${isLocating ? 'animate-pulse' : ''}`} />
              </div>
              <div className="text-left">
                <p className="font-bold text-[#148F4D] text-[15px]">
                  {isLocating ? 'Locating...' : 'Use Current GPS Location'}
                </p>
                <p className="text-xs font-semibold text-[#23C16B]">Auto-detect locality via device GPS</p>
              </div>
            </div>
            {!isLocating && <ArrowRight className="w-5 h-5 text-[#23C16B]" />}
          </button>

          {/* Search */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-[15px] font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-shadow"
              placeholder="Search street, society, landmark, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Cities */}
          <div className="flex flex-wrap gap-2.5 mb-8">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => setCity(c)}
                className={`px-4 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 border transition-all ${
                  city === c 
                    ? 'bg-gradient-to-r from-[#FF5B33] to-[#E04B28] text-white border-transparent shadow-[0_4px_12px_rgba(255,91,51,0.3)]'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-base leading-none">🏙️</span> {c}
              </button>
            ))}
          </div>

          {/* Zones */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">AVAILABLE DELIVERY ZONES:</h3>
            <div className="space-y-3">
              {filteredZones.length === 0 ? (
                <p className="text-gray-500 text-sm py-4 text-center">No zones found matching your search.</p>
              ) : (
                filteredZones.map((zone) => {
                  const isSelected = selectedZone?.id === zone.id;
                  return (
                    <button
                      key={zone.id}
                      onClick={() => handleZoneSelect(zone.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'border-[#FF5B33] bg-[#FFF5F0]' 
                          : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${isSelected ? 'border-[#FF5B33] bg-gradient-to-br from-[#FF5B33] to-[#E04B28]' : 'border-gray-300 bg-gradient-to-br from-gray-100 to-gray-200'}`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-[15px] leading-tight">{zone.name}</p>
                          <p className="text-[13px] text-gray-500 font-medium mt-1">
                            ⏱️ {zone.deliveryTime} • Base Delivery: ₹{zone.baseFee}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-[#E6F9EF] px-2.5 py-1 rounded-full shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#23C16B]"></div>
                        <span className="text-[#148F4D] text-xs font-bold leading-none">Active Zone</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
