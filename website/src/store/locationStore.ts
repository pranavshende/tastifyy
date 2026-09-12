import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface LocationZone {
  id: string;
  name: string;
  deliveryTime: string;
  baseFee: number;
}

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
