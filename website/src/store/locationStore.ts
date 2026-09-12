import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface LocationZone {
  id: string;
  name: string;
  deliveryTime: string;
  baseFee: number;
}

export const DELIVERY_ZONES: LocationZone[] = [
  { id: '1', name: 'Main Market & Station Road', deliveryTime: '20-25 mins', baseFee: 30 },
  { id: '2', name: 'Ward 3, 4 & Green Avenue', deliveryTime: '20 mins', baseFee: 30 },
  { id: '3', name: 'College Campus & Bypass Chowk', deliveryTime: '25-30 mins', baseFee: 35 },
  { id: '4', name: 'Bus Depot & Civil Hospital Area', deliveryTime: '20-25 mins', baseFee: 30 },
  { id: '5', name: 'Lakhandur Road', deliveryTime: '20-25 mins', baseFee: 30 },
  { id: '6', name: 'Panchsheel Ward', deliveryTime: '25 mins', baseFee: 30 },
  { id: '7', name: 'M.B. Patel College Road', deliveryTime: '25-30 mins', baseFee: 35 },
  { id: '8', name: 'Ramabai Ambedkar Chowk', deliveryTime: '20-25 mins', baseFee: 30 },
  { id: '9', name: 'Nursury Colony', deliveryTime: '25 mins', baseFee: 30 },
  { id: '10', name: 'Pragati Colony', deliveryTime: '25 mins', baseFee: 30 },
  { id: '11', name: 'Birsa Munda Chowk', deliveryTime: '20 mins', baseFee: 30 },
  { id: '12', name: 'Jamanapur Road', deliveryTime: '25-30 mins', baseFee: 35 },
  { id: '13', name: 'Nagzira Road', deliveryTime: '30-35 mins', baseFee: 40 },
  { id: '14', name: 'Nipane Colony', deliveryTime: '25-30 mins', baseFee: 35 },
  { id: '15', name: 'Karanjekar College area', deliveryTime: '30-35 mins', baseFee: 40 },
];

export type City = 'Sakoli' | 'Sendurwafa' | 'Khairlanji';

interface LocationState {
  city: City;
  selectedZone: LocationZone | null;
  setCity: (city: City) => void;
  setZone: (zone: LocationZone) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      city: 'Sakoli', // Default to Sakoli
      selectedZone: null,
      setCity: (city: City) => set({ city }),
      setZone: (zone: LocationZone) => set({ selectedZone: zone }),
    }),
    {
      name: 'tastifyy-location',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
