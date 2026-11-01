import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface LocationZone {
  id: string;
  name: string;
  deliveryTime: string;
  baseFee: number;
}

export interface Coordinates {
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

export type City = 'Sakoli' | 'Sendurwafa' | 'Khairlanji';

interface LocationState {
  city: City;
  selectedZone: LocationZone | null;
  coords: Coordinates | null;
  isLocating: boolean;
  locationError: string | null;
  setCity: (city: City) => void;
  setZone: (zone: LocationZone) => void;
  setCoords: (coords: Coordinates | null) => void;
  detectLiveLocation: () => Promise<boolean>;
}

/**
 * Reverse geocodes coordinates to a user-friendly locality name.
 * 1. BigDataCloud client API (designed for client-side CORS, fast, no API key).
 * 2. OpenStreetMap Nominatim API (fallback).
 * 3. Proximity fallback to Sakoli locality.
 */
async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  // 1. Try BigDataCloud free client reverse geocoding
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const locality =
        data.locality ||
        data.city ||
        (Array.isArray(data.localityInfo?.administrative) &&
          data.localityInfo.administrative[data.localityInfo.administrative.length - 1]?.name) ||
        data.principalSubdivision;

      if (locality && typeof locality === 'string' && locality.trim()) {
        return locality.trim();
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Try OpenStreetMap Nominatim reverse geocoding
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
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
      const name =
        addr.suburb ||
        addr.neighbourhood ||
        addr.road ||
        addr.village ||
        addr.town ||
        addr.city ||
        data.name;

      if (name && typeof name === 'string' && name.trim()) {
        return name.trim();
      }
    }
  } catch {
    // Continue to fallback
  }

  return 'Current Location';
}

function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    // Try high accuracy first (e.g. mobile GPS), fallback to standard accuracy (laptops / Wi-Fi)
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        // If user denied permission explicitly, don't retry
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error('Location permission was denied. Please allow location access in your browser.'));
          return;
        }

        // For timeout or unavailable, retry with relaxed constraints
        navigator.geolocation.getCurrentPosition(
          resolve,
          (retryErr) => {
            const msg =
              retryErr.code === retryErr.PERMISSION_DENIED
                ? 'Location permission was denied.'
                : 'Unable to retrieve your location.';
            reject(new Error(msg));
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 }
    );
  });
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      city: 'Sakoli',
      selectedZone: null,
      coords: null,
      isLocating: false,
      locationError: null,

      setCity: (city: City) => set({ city }),
      setZone: (zone: LocationZone) => set({ selectedZone: zone, locationError: null }),
      setCoords: (coords: Coordinates | null) => set({ coords }),

      detectLiveLocation: async () => {
        // Prevent concurrent requests
        if (get().isLocating) return false;

        set({ isLocating: true, locationError: null });

        try {
          const position = await getBrowserPosition();
          const { latitude, longitude } = position.coords;

          const locationName = await reverseGeocode(latitude, longitude);

          const gpsZone: LocationZone = {
            id: 'gps',
            name: locationName,
            deliveryTime: '20-30 mins',
            baseFee: 30,
          };

          set({
            selectedZone: gpsZone,
            coords: { latitude, longitude },
            city: 'Sakoli',
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
        coords: state.coords,
      }),
    }
  )
);
