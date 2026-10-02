import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import RestaurantCard from '../../components/customer/RestaurantCard';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { Search, ArrowRight, MapPin, ChevronLeft, ChevronRight, Leaf, Star } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Restaurant {
  id: string;
  name: string;
  city: string;
  is_pure_veg: boolean;
  cuisine_tags: string[];
  cover_image_url?: string;
  logo_url?: string;
  is_open: boolean;
  avg_preparation_time_mins?: number;
  status: string;
  rating?: number;
  distance_km?: number;
  reviews_count?: number;
}

interface LocationState {
  city: string;
  loading: boolean;
  error: string | null;
  coords: { latitude: number; longitude: number } | null;
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'nearby', label: 'Nearby' },
  { key: 'veg', label: 'Veg' },
  { key: 'open', label: 'Open Now' },
  { key: 'top_rated', label: 'Top Rated' },
] as const;

const OFFER_SLIDES = [
  {
    id: 1,
    title: '50% OFF',
    subtitle: 'Up to ₹200 on your first order',
    cta: 'Order now',
    gradient: 'from-[#FF4112] to-[#FF7B33]',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Free Delivery',
    subtitle: 'On orders above ₹199',
    cta: 'Explore deals',
    gradient: 'from-[#171717] to-[#2D2D2D]',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Taste of the Week',
    subtitle: 'Fresh combos from your favorite local spots',
    cta: 'Discover now',
    gradient: 'from-[#23C16B] to-[#148F4D]',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=900&auto=format&fit=crop',
  },
];

function formatDistance(distanceKm?: number) {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm)) return 'Distance unavailable';
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

function getLocationSummary(city: string, loading: boolean, error: string | null) {
  if (loading) return 'Detecting your location...';
  if (error) return 'Location unavailable';
  return `Near ${city || 'your area'}`;
}

function normalizeRestaurant(restaurant: any): Restaurant {
  return {
    ...restaurant,
    rating: typeof restaurant.rating === 'number' ? restaurant.rating : 4.2,
    reviews_count: typeof restaurant.reviews_count === 'number' ? restaurant.reviews_count : 0,
    distance_km: typeof restaurant.distance === 'number' ? restaurant.distance : restaurant.distance_km,
    city: restaurant.city || 'Sakoli',
    cuisine_tags: Array.isArray(restaurant.cuisine_tags) ? restaurant.cuisine_tags : [],
    is_pure_veg: Boolean(restaurant.is_pure_veg),
    is_open: restaurant.is_open !== false,
  };
}

export default function CustomerHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]['key']>('top_rated');
  const [activeOffer, setActiveOffer] = useState(0);
  const [isOfferPaused, setIsOfferPaused] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>({
    city: 'Sakoli',
    loading: true,
    error: null,
    coords: null,
  });

  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState({ city: 'Sakoli', loading: false, error: 'Geolocation is not supported on this device.', coords: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await response.json();
          const details = data?.address ?? {};
          const city = details.city || details.town || details.village || details.suburb || details.county || 'Sakoli';
          setLocationState({ city, loading: false, error: null, coords: { latitude, longitude } });
        } catch {
          setLocationState({ city: 'Sakoli', loading: false, error: null, coords: { latitude, longitude } });
        }
      },
      (geoError) => {
        const message = geoError.code === geoError.PERMISSION_DENIED
          ? 'Location access is disabled. Please enable location permission or select your location manually.'
          : 'Location detection is unavailable right now.';
        setLocationState({ city: 'Sakoli', loading: false, error: message, coords: null });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 600000 }
    );
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!isOfferPaused) {
        setActiveOffer((current) => (current + 1) % OFFER_SLIDES.length);
      }
    }, 4200);

    return () => window.clearInterval(intervalId);
  }, [isOfferPaused]);

  useEffect(() => {
    const fetchRestaurantsAndFavorites = async () => {
      setLoading(true);
      setError('');

      try {
        const effectiveFilter = activeFilter === 'all' ? 'top_rated' : activeFilter;
        const [restaurantsResponse, favoritesResponse] = await Promise.all([
          api.get('/customer/restaurants', {
            params: {
              filter: effectiveFilter,
            },
          }),
          user ? api.get('/customer/favorites').catch(() => ({ data: { success: false } })) : Promise.resolve({ data: { success: false } }),
        ]);

        const restaurantData = Array.isArray(restaurantsResponse.data)
          ? restaurantsResponse.data
          : restaurantsResponse.data?.data || [];

        const normalizedRestaurants = restaurantData.map(normalizeRestaurant);
        const sortedRestaurants = normalizedRestaurants.sort((a: Restaurant, b: Restaurant) => {
          const distanceA = typeof a.distance_km === 'number' ? a.distance_km : Number.MAX_SAFE_INTEGER;
          const distanceB = typeof b.distance_km === 'number' ? b.distance_km : Number.MAX_SAFE_INTEGER;
          return distanceA - distanceB;
        });

        setRestaurants(sortedRestaurants);

        if (favoritesResponse.data?.success) {
          setFavoriteIds(new Set((favoritesResponse.data.data || []).map((favorite: any) => favorite.id)));
        } else {
          setFavoriteIds(new Set());
        }
      } catch (err: any) {
        console.error('Failed to load restaurants', err);
        setError(err.response?.data?.error?.message || 'Failed to load restaurants nearby. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantsAndFavorites();
  }, [locationState.coords, user, activeFilter]);

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!user) {
      navigate('/customer/login');
      return;
    }

    const isFav = favoriteIds.has(id);
    const nextFavorites = new Set(favoriteIds);
    if (isFav) nextFavorites.delete(id);
    else nextFavorites.add(id);
    setFavoriteIds(nextFavorites);

    try {
      if (isFav) {
        await api.delete(`/customer/favorites/${id}`);
      } else {
        await api.post(`/customer/favorites/${id}`);
      }
    } catch (err) {
      setFavoriteIds(favoriteIds);
      console.error('Failed to toggle favorite', err);
    }
  };

  const cuisines = [
    { name: 'North Indian', image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=200&auto=format&fit=crop' },
    { name: 'Chinese', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=200&auto=format&fit=crop' },
    { name: 'Pizza', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=200&auto=format&fit=crop' },
    { name: 'Biryani', image: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=200&auto=format&fit=crop' },
    { name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200&auto=format&fit=crop' },
    { name: 'Desserts', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=200&auto=format&fit=crop' },
    { name: 'Snacks', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=200&auto=format&fit=crop' },
    { name: 'Healthy', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=200&auto=format&fit=crop' },
    { name: 'Beverages', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=200&auto=format&fit=crop' },
    { name: 'Seafood', image: 'https://images.unsplash.com/photo-1615141982883-c7da0e698cb0?q=80&w=200&auto=format&fit=crop' },
    { name: 'More', isMore: true },
  ];

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'nearby') return typeof restaurant.distance_km === 'number' && restaurant.distance_km <= 5;
      if (activeFilter === 'veg') return restaurant.is_pure_veg;
      if (activeFilter === 'open') return restaurant.is_open;
      if (activeFilter === 'top_rated') return Number(restaurant.rating ?? 0) >= 4.5;
      return true;
    });
  }, [activeFilter, restaurants]);

  const currentOffer = OFFER_SLIDES[activeOffer];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900 flex flex-col pb-24">
      <Header showSearch={false} />

      <section className="relative w-full bg-gradient-to-r from-[#FFF5F0] to-[#FFEBE0] overflow-hidden pt-6 pb-12 lg:pt-16 lg:pb-20">
        <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden md:block">
          <img src="https://images.unsplash.com/photo-1543353071-10c8ba85a904?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover object-left rounded-l-[100px] shadow-[-20px_0_40px_rgba(0,0,0,0.05)] opacity-95" alt="Delicious Food" />
          <div className="absolute right-1/4 top-[40%] -translate-y-1/2 w-28 h-28 lg:w-36 lg:h-36 bg-brand-primary rounded-full flex flex-col items-center justify-center text-white text-center p-3 lg:p-5 shadow-[0_10px_30px_rgba(255,91,51,0.4)] rotate-12">
            <span className="font-bold text-[10px] lg:text-sm leading-tight text-white/90">Food Brings<br/>People<br/>Together</span>
            <span className="text-lg lg:text-2xl mt-0.5 lg:mt-1">♥</span>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center">
          <div className="md:hidden w-full h-48 mb-6 relative">
            <img src="https://images.unsplash.com/photo-1543353071-10c8ba85a904?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover rounded-[32px] shadow-lg" alt="Delicious Food" />
            <div className="absolute -bottom-4 right-2 rotate-[-8deg]">
              <span className="font-handwriting text-[32px] text-brand-secondary drop-shadow-md">Good Food<br/>Happier You ♡</span>
            </div>
          </div>

          <div className="w-full md:w-[55%] text-left md:pr-10 lg:pr-20 pt-4 md:pt-0">
            <div className="flex items-center gap-2 text-brand-primary font-bold text-xs lg:text-sm tracking-widest uppercase mb-3 lg:mb-4">
              <MapPin className="h-4 w-4" />
              <span>{getLocationSummary(locationState.city, locationState.loading, locationState.error)}</span>
            </div>

            <h1 className="text-[40px] md:text-5xl lg:text-[72px] font-black tracking-tight mb-3 lg:mb-5 text-gray-900 leading-[1.05]">
              What are you<br />
              <span className="text-brand-primary">craving today?</span>
            </h1>

            <p className="text-gray-600 text-sm lg:text-xl mb-6 lg:mb-10 max-w-sm lg:max-w-md font-medium">
              Discover delicious food near you
            </p>

            <div className="relative w-full max-w-xl bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 flex items-center p-1.5 lg:p-2 mb-6 lg:mb-8">
              <div className="pl-4 pr-2 flex items-center pointer-events-none">
                <Search className="w-5 h-5 lg:w-6 lg:h-6 text-gray-400" />
              </div>
              <input
                type="text"
                className="flex-1 w-full py-2.5 lg:py-3.5 bg-transparent focus:outline-none text-sm lg:text-base font-semibold text-gray-900 placeholder-gray-400"
                placeholder="Search restaurants, cuisines or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/customer/search?q=${encodeURIComponent(searchQuery)}`);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (searchQuery.trim()) navigate(`/customer/search?q=${encodeURIComponent(searchQuery)}`);
                }}
                className="bg-brand-primary hover:bg-brand-secondary text-white px-6 lg:px-8 py-3 lg:py-3.5 rounded-full font-bold transition-all text-sm lg:text-base flex items-center gap-2 shadow-[0_4px_14px_0_rgba(255,91,51,0.39)] hover:shadow-[0_6px_20px_rgba(255,91,51,0.23)] ml-2"
              >
                <Search className="w-4 h-4 hidden sm:block" /> Search
              </button>
            </div>

            <div className="flex flex-wrap gap-2 lg:gap-3">
              {['Pizza', 'Biryani', 'Chinese', 'North Indian', 'Burger', 'Desserts'].map((tag) => (
                <button key={tag} className="px-4 lg:px-5 py-1.5 lg:py-2 bg-white/60 hover:bg-white text-gray-700 text-xs lg:text-sm font-bold rounded-full border border-white shadow-sm hover:shadow-md transition-all">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 lg:mt-10">
        <div className="mb-4 flex items-center justify-between gap-3 text-sm font-bold text-gray-500">
          <span>Trending now</span>
          <span className="rounded-full bg-brand-primary/10 px-3 py-1 text-brand-primary">{currentOffer.title}</span>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`flex-shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                  activeFilter === filter.key
                    ? 'border-brand-primary bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-brand-primary hover:text-brand-primary'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <section className="py-4 md:py-6">
          <div
            className="relative overflow-hidden rounded-[28px] shadow-lg border border-gray-100 bg-white"
            onMouseEnter={() => setIsOfferPaused(true)}
            onMouseLeave={() => setIsOfferPaused(false)}
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeOffer * 100}%)` }}
            >
              {OFFER_SLIDES.map((offer) => (
                <div key={offer.id} className={`min-w-full relative overflow-hidden bg-gradient-to-r ${offer.gradient} text-white p-6 md:p-10`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.2),_transparent_35%)]" />
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="max-w-xl">
                      <p className="text-sm uppercase tracking-[0.2em] text-white/80 font-semibold">Limited time</p>
                      <h3 className="text-3xl md:text-5xl font-black tracking-tight my-3">{offer.title}</h3>
                      <p className="text-sm md:text-lg text-white/85 font-medium">{offer.subtitle}</p>
                      <button className="mt-6 inline-flex items-center gap-2 bg-white text-gray-900 font-bold rounded-full px-5 py-2.5 shadow-sm hover:bg-gray-50 transition-colors">
                        {offer.cta} <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="relative h-36 w-36 md:h-44 md:w-44 flex-shrink-0">
                      <img
                        src={offer.image}
                        alt={offer.title}
                        className="h-full w-full object-cover rounded-full border-4 border-white/25 shadow-2xl"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              aria-label="Previous offer"
              onClick={() => setActiveOffer((current) => (current - 1 + OFFER_SLIDES.length) % OFFER_SLIDES.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-900 shadow-md transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next offer"
              onClick={() => setActiveOffer((current) => (current + 1) % OFFER_SLIDES.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-900 shadow-md transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {OFFER_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Show slide ${index + 1}`}
                  onClick={() => setActiveOffer(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    activeOffer === index ? 'w-8 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/90'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-6 md:py-8 border-b border-gray-100">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl md:text-[22px] font-black text-gray-900 tracking-tight">What's on your mind?</h2>
            </div>
            <button onClick={() => navigate('/customer/restaurants')} className="text-xs md:text-sm text-brand-primary font-bold hover:underline cursor-pointer flex items-center mb-1 transition-all">
              See all <ArrowRight className="w-3 h-3 md:w-3.5 md:h-3.5 ml-1" />
            </button>
          </div>
          <div className="flex gap-3 md:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
            {cuisines.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => navigate(cat.name === 'More' ? '/customer/restaurants' : `/customer/restaurants?category=${cat.name}`)}
                className="flex flex-col items-center cursor-pointer min-w-[76px] md:min-w-[96px] group snap-start shrink-0"
              >
                <div className="w-16 h-16 md:w-[88px] md:h-[88px] rounded-full bg-orange-50 border-0 flex items-center justify-center mb-3 shadow-[0_4px_12px_rgb(0,0,0,0.05)] group-hover:-translate-y-1.5 group-hover:shadow-[0_8px_20px_rgba(255,91,51,0.15)] transition-all duration-300 overflow-hidden relative">
                  {cat.isMore ? (
                    <div className="flex flex-wrap items-center justify-center gap-1 w-6 md:w-8">
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-brand-primary rounded-full" />
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-brand-primary/60 rounded-full" />
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-brand-primary/60 rounded-full" />
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-brand-primary/30 rounded-full" />
                    </div>
                  ) : (
                    <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={cat.name} />
                  )}
                </div>
                <span className="text-xs md:text-[13px] font-bold text-gray-700 whitespace-nowrap group-hover:text-brand-primary transition-colors text-center">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                {activeFilter === 'veg' ? <Leaf className="h-5 w-5 text-green-600" /> : <Star className="h-5 w-5 text-brand-primary" />}
                {activeFilter === 'veg' ? 'Veg Picks' : activeFilter === 'top_rated' ? 'Top Rated Near You' : activeFilter === 'nearby' ? 'Nearby Restaurants' : activeFilter === 'open' ? 'Open Now' : 'Top Rated Near You'}
              </h2>
            </div>
            <button onClick={() => navigate('/customer/restaurants')} className="text-xs text-brand-primary font-bold hover:underline flex items-center cursor-pointer mb-1">
              View all <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="w-full">
            {loading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                <LoadingSkeleton type="restaurant" count={3} />
              </div>
            ) : error ? (
              <div className="w-full bg-red-50 text-red-500 font-medium p-4 rounded-xl text-sm border border-red-100 flex justify-between items-center">
                <span>{error}</span>
                <button onClick={() => window.location.reload()} className="text-red-700 font-bold hover:underline">Try Again</button>
              </div>
            ) : filteredRestaurants.length === 0 ? (
              <div className="w-full bg-gray-50 text-gray-500 font-medium p-8 rounded-2xl text-center border border-gray-100">
                {locationState.error ? 'Location unavailable. Showing popular restaurants in Sakoli.' : 'No restaurants found nearby. Try exploring other locations!'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="w-full min-w-0">
                    <RestaurantCard
                      id={restaurant.id}
                      name={restaurant.name}
                      coverImage={restaurant.cover_image_url}
                      logo={restaurant.logo_url}
                      cuisineTags={restaurant.cuisine_tags}
                      isOpen={restaurant.is_open !== false}
                      isPureVeg={restaurant.is_pure_veg}
                      city={restaurant.city}
                      rating={restaurant.rating}
                      prepTime={restaurant.avg_preparation_time_mins}
                      distance={formatDistance(restaurant.distance_km)}
                      reviewsCount={restaurant.reviews_count ? String(restaurant.reviews_count) : undefined}
                      isFavorite={favoriteIds.has(restaurant.id)}
                      onToggleFavorite={(e) => toggleFavorite(e, restaurant.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {!loading && !error && filteredRestaurants.length > 2 && (
          <section className="py-8 border-t border-gray-100">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900">Recommended for You</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">Based on popular restaurants near you</p>
              </div>
            </div>

            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {filteredRestaurants.slice(2, 6).map((restaurant) => (
                <div key={`rec-${restaurant.id}`} className="snap-start min-w-[260px] sm:min-w-[280px] w-[260px] sm:w-[280px] shrink-0">
                  <RestaurantCard
                    id={restaurant.id}
                    name={restaurant.name}
                    coverImage={restaurant.cover_image_url}
                    logo={restaurant.logo_url}
                    cuisineTags={restaurant.cuisine_tags}
                    isOpen={restaurant.is_open !== false}
                    isPureVeg={restaurant.is_pure_veg}
                    city={restaurant.city}
                    rating={restaurant.rating}
                    prepTime={restaurant.avg_preparation_time_mins}
                    distance={formatDistance(restaurant.distance_km)}
                    reviewsCount={restaurant.reviews_count ? String(restaurant.reviews_count) : undefined}
                    isFavorite={favoriteIds.has(restaurant.id)}
                    onToggleFavorite={(e) => toggleFavorite(e, restaurant.id)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
