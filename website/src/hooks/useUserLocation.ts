import { useState, useEffect } from 'react';

interface LocationState {
  city: string;
  loading: boolean;
  error: string | null;
}

const CACHE_KEY = 'tastifyy_user_city';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export function useUserLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    city: 'Locating…',
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Return cached value if still fresh
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { city, ts } = JSON.parse(cached) as { city: string; ts: number };
        if (Date.now() - ts < CACHE_TTL_MS) {
          setState({ city, loading: false, error: null });
          return;
        }
      }
    } catch {
      // ignore parse errors
    }

    if (!navigator.geolocation) {
      setState({ city: 'Your Location', loading: false, error: 'Geolocation unsupported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address ?? {};
          // Pick the most specific populated locality name available
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.suburb ||
            addr.county ||
            'Your Location';

          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ city, ts: Date.now() }));
          setState({ city, loading: false, error: null });
        } catch {
          setState({ city: 'Your Location', loading: false, error: 'Reverse geocode failed' });
        }
      },
      (err) => {
        // Permission denied or timeout — fail gracefully
        const fallback = err.code === err.PERMISSION_DENIED ? 'Set Location' : 'Your Location';
        setState({ city: fallback, loading: false, error: err.message });
      },
      { timeout: 8000, maximumAge: CACHE_TTL_MS }
    );
  }, []);

  return state;
}
