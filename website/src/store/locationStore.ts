import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface LocationZone {
  id: string;
  name: string;
  deliveryTime: string;
  baseFee: number;
  fullAddress?: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DetectedAddress {
  displayName: string;
  shortName: string;
  city: string;
  state?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
}

export const SAKOLI_COORDS: Coordinates = {
  latitude: 21.0833,
  longitude: 79.9833,
};

export const DELIVERY_ZONES: LocationZone[] = [
  { id: '1', name: 'Manohar Bhai Patel College area', deliveryTime: '20-25 mins', baseFee: 30 },
  { id: '2', name: 'Karanjekar College area', deliveryTime: '25-30 mins', baseFee: 35 },
  { id: '3', name: 'NH-53 / Main Highway', deliveryTime: '20 mins', baseFee: 30 },
  { id: '4', name: 'Nagzira Road', deliveryTime: '30-35 mins', baseFee: 40 },
  { id: '5', name: 'Jamnapur', deliveryTime: '25-30 mins', baseFee: 35 },
  { id: '6', name: 'Virshi', deliveryTime: '30-40 mins', baseFee: 45 },
  { id: '7', name: 'Ganesh Ward', deliveryTime: '15-20 mins', baseFee: 30 },
  { id: '8', name: 'Panchshil Ward', deliveryTime: '15-20 mins', baseFee: 30 },
  { id: '9', name: 'LIC / BSNL Tower area', deliveryTime: '15-20 mins', baseFee: 30 },
  { id: '10', name: 'Sakoli Main Chowk', deliveryTime: '15 mins', baseFee: 25 },
  { id: '11', name: 'Hospital area', deliveryTime: '15-20 mins', baseFee: 30 },
  { id: '12', name: 'Sakoli Lake / Tourist Side', deliveryTime: '25-30 mins', baseFee: 35 },
];

export type City = string;

interface LocationState {
  city: City;
  selectedZone: LocationZone | null;
  fullAddress: string | null;
  shortName: string | null;
  coords: Coordinates | null;
  isLocating: boolean;
  locationError: string | null;
  setCity: (city: City) => void;
  setZone: (zone: LocationZone) => void;
  setCoords: (coords: Coordinates | null) => void;
  setDetectedAddress: (addr: DetectedAddress) => void;
  detectLiveLocation: (force?: boolean) => Promise<boolean>;
}

/**
 * Reverse geocodes coordinates to a full user-friendly address.
 * Primary: OpenStreetMap Nominatim (matches Checkout.tsx).
 * Fallback: BigDataCloud Client API.
 */
async function fetchLiveAddress(latitude: number, longitude: number): Promise<DetectedAddress> {
  // 1. Try Nominatim (same reliable endpoint used by Checkout.tsx)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const detectedCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || 'Nagpur';
      const localityPart = addr.suburb || addr.neighbourhood || addr.road || '';
      const short = localityPart && localityPart !== detectedCity
        ? `${localityPart}, ${detectedCity}`
        : detectedCity;

      return {
        displayName: data.display_name || `${short}, ${addr.state || ''} ${addr.postcode || ''}`.trim(),
        shortName: short,
        city: detectedCity,
        state: addr.state || '',
        pincode: addr.postcode || '',
        latitude,
        longitude,
      };
    }
  } catch (e) {
    console.warn('Nominatim reverse geocode error:', e);
  }

  // 2. Fallback: BigDataCloud free client reverse geocoding
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const detectedCity = data.city || data.locality || 'Nagpur';
      const state = data.principalSubdivision || '';
      return {
        displayName: `${detectedCity}, ${state}`.trim(),
        shortName: detectedCity,
        city: detectedCity,
        state,
        pincode: data.postcode || '',
        latitude,
        longitude,
      };
    }
  } catch (e) {
    console.warn('BigDataCloud reverse geocode error:', e);
  }

  return {
    displayName: 'Current Location',
    shortName: 'Current Location',
    city: 'Nagpur',
    latitude,
    longitude,
  };
}

function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      (_err) => {
        // Retry with relaxed constraints if high accuracy fails/times out
        navigator.geolocation.getCurrentPosition(
          resolve,
          (retryErr) => {
            const msg =
              retryErr.code === retryErr.PERMISSION_DENIED
                ? 'Location permission was denied. Please allow location access in your browser.'
                : 'Unable to retrieve your location.';
            reject(new Error(msg));
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      city: 'Sakoli',
      selectedZone: null,
      fullAddress: null,
      shortName: null,
      coords: null,
      isLocating: false,
      locationError: null,

      setCity: (city: City) => set({ city }),
      setZone: (zone: LocationZone) =>
        set({
          selectedZone: zone,
          shortName: zone.name,
          fullAddress: zone.fullAddress || zone.name,
          locationError: null,
        }),
      setCoords: (coords: Coordinates | null) => set({ coords }),

      setDetectedAddress: (addr: DetectedAddress) => {
        const zone: LocationZone = {
          id: 'saved_or_gps',
          name: addr.shortName,
          fullAddress: addr.displayName,
          deliveryTime: '20-30 mins',
          baseFee: 30,
        };
        set({
          selectedZone: zone,
          fullAddress: addr.displayName,
          shortName: addr.shortName,
          city: addr.city,
          coords: { latitude: addr.latitude, longitude: addr.longitude },
          locationError: null,
        });
      },

      detectLiveLocation: async (_force = false) => {
        // Prevent concurrent requests
        if (get().isLocating) return false;

        set({ isLocating: true, locationError: null });

        try {
          const position = await getBrowserPosition();
          const { latitude, longitude } = position.coords;

          const detected = await fetchLiveAddress(latitude, longitude);

          const gpsZone: LocationZone = {
            id: 'gps',
            name: detected.shortName,
            fullAddress: detected.displayName,
            deliveryTime: '20-30 mins',
            baseFee: 30,
          };

          set({
            selectedZone: gpsZone,
            fullAddress: detected.displayName,
            shortName: detected.shortName,
            coords: { latitude, longitude },
            city: detected.city,
            isLocating: false,
            locationError: null,
          });

          return true;
        } catch (error: any) {
          const errorMessage = error?.message || 'Failed to detect your live location.';
          set({
            isLocating: false,
            locationError: errorMessage,
          });
          return false;
        }
      },
    }),
    {
      name: 'tastifyy-location',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        city: state.city,
        selectedZone: state.selectedZone,
        fullAddress: state.fullAddress,
        shortName: state.shortName,
        coords: state.coords,
      }),
    }
  )
);
