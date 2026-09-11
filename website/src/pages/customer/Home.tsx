import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import RestaurantCard from '../../components/customer/RestaurantCard';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { Search, ShoppingBag, ArrowRight } from 'lucide-react';
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
    { name: 'More', isMore: true }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-gray-900 flex flex-col pb-24">
      <Header 
        showSearch={false}

      />

      {/* Full Width Hero */}
      <section className="relative w-full bg-gradient-to-r from-[#FFF5F0] to-[#FFEBE0] overflow-hidden pt-6 pb-12 lg:pt-16 lg:pb-20">
        {/* Background decoration (Desktop) */}
        <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden md:block">
          <img src="https://images.unsplash.com/photo-1543353071-10c8ba85a904?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover object-left rounded-l-[100px] shadow-[-20px_0_40px_rgba(0,0,0,0.05)] opacity-95" alt="Delicious Food" />
          
          {/* Food Brings People Together Badge */}
          <div className="absolute right-1/4 top-[40%] transform -translate-y-1/2 w-28 h-28 lg:w-36 lg:h-36 bg-brand-primary rounded-full flex flex-col items-center justify-center text-white text-center p-3 lg:p-5 shadow-[0_10px_30px_rgba(255,91,51,0.4)] rotate-12">
            <span className="font-bold text-[10px] lg:text-sm leading-tight text-white/90">Food Brings<br/>People<br/>Together</span>
            <span className="text-lg lg:text-2xl mt-0.5 lg:mt-1">♥</span>
          </div>
        </div>
        
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center">
          
          {/* Mobile Food Image (only visible on mobile, above text) */}
          <div className="md:hidden w-full h-48 mb-6 relative">
            <img src="https://images.unsplash.com/photo-1543353071-10c8ba85a904?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover rounded-[32px] shadow-lg" alt="Delicious Food" />
            <div className="absolute -bottom-4 right-2 rotate-[-8deg]">
              <span className="font-handwriting text-[32px] text-brand-secondary drop-shadow-md">Good Food<br/>Happier You ♡</span>
            </div>
          </div>

          <div className="w-full md:w-[55%] text-left md:pr-10 lg:pr-20 pt-4 md:pt-0">
            
            <p className="text-brand-primary font-bold text-xs lg:text-sm tracking-widest uppercase mb-3 lg:mb-4">Good Food • Happy People</p>
            
            <h1 className="text-[40px] md:text-5xl lg:text-[72px] font-black tracking-tight mb-3 lg:mb-5 text-gray-900 leading-[1.05]">
              What are you<br />
              <span className="text-brand-primary">craving today?</span>
            </h1>
            
            <p className="text-gray-600 text-sm lg:text-xl mb-6 lg:mb-10 max-w-sm lg:max-w-md font-medium">
              Discover delicious food near you
            </p>

            {/* Hand written text for desktop */}
            <div className="hidden md:block absolute left-[45%] lg:left-[48%] top-6 lg:top-10 rotate-[-8deg]">
              <span className="font-handwriting text-4xl lg:text-5xl text-brand-secondary/90 leading-none">Good Food<br/>Happier You ♡</span>
            </div>
            
            {/* Search Bar inside Hero */}
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

            {/* Categories / Tags */}
            <div className="flex flex-wrap gap-2 lg:gap-3">
              {['Pizza', 'Biryani', 'Chinese', 'North Indian', 'Burger', 'Desserts'].map(tag => (
                <button key={tag} className="px-4 lg:px-5 py-1.5 lg:py-2 bg-white/60 hover:bg-white text-gray-700 text-xs lg:text-sm font-bold rounded-full border border-white shadow-sm hover:shadow-md transition-all">
                  {tag}
                </button>
              ))}
            </div>
            
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 lg:mt-10">

        {/* Offers Horizontal Scroll */}
        <section className="py-4 md:py-6">
          <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide snap-x pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
            
            {/* Offer 1: 50% OFF */}
            <div className="snap-start min-w-[320px] md:min-w-[480px] lg:min-w-[550px] w-full max-w-[600px] h-40 md:h-48 rounded-2xl md:rounded-3xl cursor-pointer shadow-lg hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden bg-gradient-to-r from-[#FF4112] to-[#FF7B33] text-white flex items-center">
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
              
              <div className="relative z-10 pl-5 md:pl-8 flex flex-col justify-center h-full w-[60%]">
                <span className="text-white/90 text-sm md:text-base font-bold mb-0.5">First Order</span>
                <h3 className="text-[32px] md:text-[44px] font-black leading-none mb-1 tracking-tight">50% OFF</h3>
                <p className="text-white/80 text-xs md:text-sm font-medium mb-4">Up to ₹200 on your first order</p>
                <button className="bg-white text-brand-primary font-bold text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 rounded-full w-max flex items-center gap-1.5 hover:bg-gray-50 transition-colors shadow-sm">
                  Order Now <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="absolute right-0 bottom-0 top-0 w-[45%] flex items-center justify-end pr-2 md:pr-6 pointer-events-none">
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute top-4 right-2 rotate-12 text-white/90 font-handwriting text-lg md:text-2xl leading-none text-center">Tasty<br/>Deals<br/>Always!</div>
                  <img src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300&auto=format&fit=crop" className="w-24 h-24 md:w-36 md:h-36 rounded-full object-cover border-4 border-white/20 shadow-2xl rotate-[-15deg] transform translate-y-4 md:translate-y-2" alt="Burger" />
                </div>
              </div>
            </div>

            {/* Offer 2: FREE DELIVERY */}
            <div className="snap-start min-w-[320px] md:min-w-[480px] lg:min-w-[550px] w-full max-w-[600px] h-40 md:h-48 rounded-2xl md:rounded-3xl cursor-pointer shadow-lg hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden bg-gradient-to-r from-[#171717] to-[#2D2D2D] text-white flex items-center">
              
              <div className="relative z-10 pl-5 md:pl-8 flex flex-col justify-center h-full w-[60%]">
                <h3 className="text-[28px] md:text-[36px] font-black leading-[1.1] mb-1.5 tracking-tight uppercase">FREE DELIVERY</h3>
                <p className="text-gray-300 text-xs md:text-sm font-medium mb-4">On orders above ₹199</p>
                <button className="bg-white text-gray-900 font-bold text-xs md:text-sm px-4 md:px-5 py-2 md:py-2.5 rounded-full w-max flex items-center gap-1.5 hover:bg-gray-50 transition-colors shadow-sm">
                  Order Now <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="absolute right-0 bottom-0 top-0 w-[45%] flex items-center justify-end pr-4 md:pr-8 pointer-events-none">
                 <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute top-4 right-0 rotate-[-8deg] text-gray-300 font-handwriting text-xl md:text-3xl leading-none text-center">Good<br/>Food<br/>No Wait!</div>
                  <div className="w-20 h-20 md:w-28 md:h-28 bg-brand-primary/20 rounded-full blur-2xl absolute right-4"></div>
                  {/* Since we don't have a scooter illustration, we'll use a relevant fast food/delivery vibe image or icon, or an Unsplash image of a delivery bag/box */}
                  <img src="https://images.unsplash.com/photo-1526367790999-0150786686a2?q=80&w=300&auto=format&fit=crop" className="w-20 h-20 md:w-32 md:h-32 rounded-full object-cover border-4 border-gray-700 shadow-2xl transform translate-y-4 md:translate-y-2 z-10" alt="Delivery" />
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Popular Cuisines */}
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
                       <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-brand-primary rounded-full"></div>
                       <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-brand-primary/60 rounded-full"></div>
                       <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-brand-primary/60 rounded-full"></div>
                       <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-brand-primary/30 rounded-full"></div>
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
        <div className="fixed bottom-24 left-4 right-4 md:bottom-8 md:left-auto md:right-8 z-40 md:w-[28rem]">
          <div className="bg-[#1C1C1E] rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.2)] p-2 md:p-3 flex items-center justify-between border border-[#2C2C2E] transition-transform hover:-translate-y-1 duration-300">
            <div className="flex items-center gap-3 pl-2 md:pl-4">
              <div className="relative flex items-center justify-center pt-1 pr-1">
                <ShoppingBag className="w-6 h-6 md:w-7 md:h-7 text-gray-300" strokeWidth={1.5} />
                <span className="absolute -top-1 -right-1 bg-[#FF4112] text-white text-[10px] font-black w-[18px] h-[18px] flex items-center justify-center rounded-full shadow-sm">
                  {totalItems}
                </span>
              </div>
              <div className="flex flex-col ml-2">
                <p className="text-gray-300 text-xs md:text-sm font-semibold leading-tight">{totalItems} item{totalItems > 1 ? 's' : ''}</p>
                <p className="text-white font-black text-sm md:text-base leading-tight mt-0.5">₹{totals.itemSubtotal}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/customer/restaurants/${restaurantId}`)}
              className="bg-gradient-to-r from-[#FF5B33] to-[#E04B28] hover:from-[#E04B28] hover:to-[#C1531A] text-white font-bold py-2.5 px-5 md:py-3 md:px-6 rounded-full transition-all flex items-center gap-2 text-sm md:text-base shadow-[0_4px_14px_0_rgba(255,91,51,0.39)]"
            >
              View Cart <ArrowRight className="w-4 h-4 md:w-4.5 md:h-4.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
