import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import RestaurantCard from '../../components/customer/RestaurantCard';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { Search, ShoppingBag, Tag, Bike, ArrowRight, MapPin } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useUserLocation } from '../../hooks/useUserLocation';

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
}

export default function CustomerHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const userLocation = useUserLocation();
  
  const { items, getTotals, restaurantId } = useCartStore();
  const totals = getTotals();
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await api.get('/restaurants');
        setRestaurants(response.data);
      } catch (err: any) {
        console.error('Failed to load restaurants', err);
        setError('Failed to load restaurants nearby. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const cuisines = [
    { name: 'North Indian', icon: '🍲' },
    { name: 'Chinese', icon: '🥡' },
    { name: 'Pizza', icon: '🍕' },
    { name: 'Biryani', icon: '🥘' },
    { name: 'More', icon: '•••' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col pb-24">
      <Header 
        showSearch={false}

      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6">
        
        {/* Discovery Hero Section */}
        <section className="pt-8 pb-10 flex flex-col items-center text-center px-2">
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors mb-8 group">
            <MapPin className="w-4 h-4 text-brand-primary group-hover:animate-bounce" />
            <span className="text-gray-400 font-medium">Delivering to</span>
            <span className="text-gray-900 border-b border-dashed border-gray-300">
              {userLocation.loading ? 'Locating...' : (userLocation.city || 'Select Location')}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-gray-900 leading-tight">
            What are you <br className="sm:hidden" /> craving <span className="text-brand-primary">today?</span>
          </h1>
          <p className="text-gray-500 text-sm md:text-base mb-8 max-w-sm md:max-w-md mx-auto font-medium">
            Discover delicious food from restaurants near you. Freshly prepared and delivered in minutes.
          </p>
          
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 focus-within:border-brand-primary/50 focus-within:shadow-[0_8px_30px_rgb(255,107,0,0.1)] transition-all flex items-center p-1.5">
            <div className="pl-4 pr-2 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="flex-1 w-full py-3.5 bg-transparent focus:outline-none text-sm md:text-base font-bold text-gray-900 placeholder-gray-400"
              placeholder="Search for restaurants, cuisines..."
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
              className="bg-brand-primary hover:bg-brand-secondary text-white px-5 py-3 rounded-xl font-bold transition-colors text-sm whitespace-nowrap ml-2 hidden sm:block"
            >
              Find Food
            </button>
          </div>
        </section>

        {/* Offers Horizontal Scroll */}
        <section className="py-4">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {restaurants.slice(0, 2).map((restaurant, idx) => (
              <div 
                key={idx}
                onClick={() => navigate('/customer/restaurants')}
                className={`snap-start min-w-[260px] sm:min-w-[300px] rounded-2xl p-5 cursor-pointer shadow-lg hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden group ${
                  idx === 0 
                    ? 'bg-gradient-to-br from-brand-primary to-orange-600 text-white shadow-orange-500/20' 
                    : 'bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-gray-900/20'
                }`}
              >
                <div className={`absolute right-0 top-0 w-32 h-32 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700 ${idx === 0 ? 'bg-white/10' : 'bg-brand-primary/20'}`}></div>
                <div className="relative z-10 flex items-center justify-between mb-4">
                  <div className="text-xs font-bold uppercase tracking-widest opacity-80">
                    {idx === 0 ? 'First Order' : 'Special Offer'}
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border ${idx === 0 ? 'bg-white/20 border-white/20' : 'bg-white/10 border-white/10'}`}>
                    {idx === 0 ? <Tag className="w-4 h-4" /> : <Bike className="w-4 h-4" />}
                  </div>
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-1">{idx === 0 ? '50% OFF' : 'FREE DELIVERY'}</h3>
                  <p className="text-sm font-medium opacity-90 mb-3 truncate">At {restaurant.name}</p>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-sm border inline-block ${idx === 0 ? 'bg-white/20 border-white/20' : 'bg-white/10 border-white/10'}`}>
                    {idx === 0 ? 'WELCOME50' : 'FREEDEL'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Cuisines */}
        <section className="py-8 border-b border-gray-100">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900">What's on your mind?</h2>
            </div>
            <button onClick={() => navigate('/customer/restaurants')} className="text-xs text-brand-primary font-bold hover:underline cursor-pointer flex items-center mb-1">
              View all <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
            {cuisines.map((cat, idx) => (
              <div 
                key={idx} 
                onClick={() => navigate(cat.name === 'More' ? '/customer/restaurants' : `/customer/restaurants?category=${cat.name}`)}
                className="flex flex-col items-center cursor-pointer min-w-[72px] md:min-w-[80px] group snap-start"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border border-gray-100 flex items-center justify-center text-3xl mb-3 shadow-[0_4px_20px_rgb(0,0,0,0.03)] group-hover:border-brand-primary/50 group-hover:-translate-y-1 group-hover:shadow-brand-primary/10 transition-all duration-300">
                  {cat.name === 'More' ? <span className="text-gray-400 text-sm font-bold tracking-widest">{cat.icon}</span> : cat.icon}
                </div>
                <span className="text-xs md:text-sm font-bold text-gray-700 whitespace-nowrap group-hover:text-brand-primary transition-colors">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Top Rated Restaurants */}
        <section className="py-8">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
                Top Rated Near You
              </h2>
            </div>
            <button onClick={() => navigate('/customer/restaurants')} className="text-xs text-brand-primary font-bold hover:underline flex items-center cursor-pointer mb-1">
              View all <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          
          <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {loading ? (
              <LoadingSkeleton type="restaurant" count={3} />
            ) : error ? (
              <div className="w-full bg-red-50 text-red-500 font-medium p-4 rounded-xl text-sm border border-red-100 flex justify-between items-center">
                <span>{error}</span>
                <button onClick={() => window.location.reload()} className="text-red-700 font-bold hover:underline">Try Again</button>
              </div>
            ) : restaurants.length === 0 ? (
              <div className="w-full bg-gray-50 text-gray-500 font-medium p-8 rounded-2xl text-center border border-gray-100">
                No restaurants found nearby. Try exploring other locations!
              </div>
            ) : (
              restaurants.map((restaurant) => (
                <div key={restaurant.id} className="snap-start min-w-[260px] sm:min-w-[280px] w-[260px] sm:w-[280px] shrink-0">
                  <RestaurantCard
                    id={restaurant.id}
                    name={restaurant.name}
                    coverImage={restaurant.cover_image_url}
                    logo={restaurant.logo_url}
                    cuisineTags={restaurant.cuisine_tags}
                    isOpen={restaurant.is_open !== false}
                    isPureVeg={restaurant.is_pure_veg}
                    city={restaurant.city}
                    rating={restaurant.rating || 4.2}
                    prepTime={restaurant.avg_preparation_time_mins}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recommended For You */}
        {!loading && !error && restaurants.length > 2 && (
          <section className="py-8 border-t border-gray-100">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900">Recommended for You</h2>
                <p className="text-xs md:text-sm text-gray-500 mt-1 font-medium">Based on popular restaurants near you</p>
              </div>
            </div>
            
            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {restaurants.slice(2, 6).map((restaurant) => (
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
                    rating={restaurant.rating || 4.5}
                    prepTime={restaurant.avg_preparation_time_mins}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Floating Cart Indicator */}
      {totalItems > 0 && restaurantId && (
        <div className="fixed bottom-4 left-4 right-4 md:bottom-8 md:left-auto md:right-8 z-50 md:w-[26rem]">
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-4 flex items-center justify-between border border-gray-800 transition-transform hover:-translate-y-1 duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center relative border border-gray-700">
                <ShoppingBag className="w-5 h-5 text-brand-primary" />
                <span className="absolute -top-2 -right-2 bg-brand-primary text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-gray-900 shadow-sm">
                  {totalItems}
                </span>
              </div>
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Your Cart</p>
                <p className="text-white font-black text-lg leading-none">₹{totals.itemSubtotal}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/customer/restaurants/${restaurantId}`)}
              className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2 text-sm shadow-[0_4px_14px_0_rgba(255,107,0,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,0,0.23)]"
            >
              View Cart <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
