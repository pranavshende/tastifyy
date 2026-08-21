import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import RestaurantCard from '../../components/customer/RestaurantCard';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { Search, ShoppingBag, Tag, Bike, ArrowRight } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';

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
        location="Mumbai"
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6">
        
        {/* Discovery Hero Section */}
        <section className="pt-6 pb-6 flex flex-col items-center text-center">
          <div className="bg-orange-50/80 text-gray-800 px-4 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2 border border-orange-100/50">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
            DELIVERING TO HOME • MUMBAI
          </div>
          
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-gray-900 leading-tight">
            What are you <br className="sm:hidden" /> craving <span className="text-brand-primary">today?</span>
          </h1>
          <p className="text-gray-500 text-sm mb-6 max-w-sm font-medium">
            Explore the best food spots around you.
            <br />
            Freshly prepared and delivered in minutes.
          </p>
          
          <div className="relative w-full max-w-xl bg-white rounded-xl shadow-sm border border-gray-100 focus-within:border-brand-primary transition-all">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-brand-primary" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-3.5 rounded-xl bg-transparent focus:outline-none text-sm font-bold text-gray-900 placeholder-gray-400"
              placeholder="Search for restaurants, cuisines, or dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </section>

        {/* Offers Horizontal Scroll */}
        <section className="py-2">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="snap-start min-w-[240px] sm:min-w-[280px] bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4 cursor-pointer shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-brand-primary">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">50% OFF</h3>
                <p className="text-gray-500 text-xs font-medium mb-1.5">At The Spice Grill</p>
                <span className="text-[9px] font-bold text-brand-primary bg-orange-50 px-2 py-0.5 rounded border border-orange-100">WELCOME50</span>
              </div>
            </div>
            
            <div className="snap-start min-w-[240px] sm:min-w-[280px] bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4 cursor-pointer shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 text-brand-primary">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-gray-900">FREE DELIVERY</h3>
                <p className="text-gray-500 text-xs font-medium mb-1.5">At Food Valley</p>
                <span className="text-[9px] font-bold text-brand-primary bg-orange-50 px-2 py-0.5 rounded border border-orange-100">FREEDEL</span>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Cuisines */}
        <section className="py-6 border-b border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-gray-900">Popular Cuisines</h2>
            <button className="text-xs text-brand-primary font-bold hover:underline">View all</button>
          </div>
          <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 justify-between sm:justify-start">
            {cuisines.map((cat, idx) => (
              <div key={idx} className="flex flex-col items-center cursor-pointer min-w-[64px]">
                <div className="w-14 h-14 rounded-full bg-white border border-gray-100 flex items-center justify-center text-2xl mb-2 shadow-sm hover:border-brand-primary transition-colors">
                  {cat.name === 'More' ? <span className="text-gray-400 text-sm font-bold tracking-widest">{cat.icon}</span> : cat.icon}
                </div>
                <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Top Rated Restaurants */}
        <section className="py-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              <span className="text-[#FFB800]">🏆</span> Top Rated Restaurants
            </h2>
            <button className="text-xs text-brand-primary font-bold hover:underline flex items-center">
              View all <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            {loading ? (
              <LoadingSkeleton type="restaurant" count={3} />
            ) : error ? (
              <div className="text-sm text-red-500 font-medium">{error}</div>
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

      </main>

      {/* Floating Cart Indicator */}
      {totalItems > 0 && restaurantId && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-brand-primary relative">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 bg-brand-dark text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {totalItems}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Your Cart</p>
                <p className="text-gray-900 font-black text-sm mt-0.5">₹{totals.itemSubtotal}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/customer/restaurants/${restaurantId}`)}
              className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-2.5 px-5 rounded-lg transition-all flex items-center gap-2 text-sm"
            >
              View Cart <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
