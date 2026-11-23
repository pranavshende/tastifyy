import { useEffect } from 'react';
import { useLocationStore } from '../store/locationStore';

interface LocationState {
  city: string;
  loading: boolean;
  error: string | null;
}

export function useUserLocation(): LocationState {
  const city = useLocationStore((state) => state.city);
  const loading = useLocationStore((state) => state.isLocating);
  const error = useLocationStore((state) => state.locationError);

  useEffect(() => {
    void useLocationStore.getState().detectLiveLocation();
  }, []);

  return {
    city: loading ? 'Locating…' : city || 'Your Location',
    loading,
    error,
  };
}
