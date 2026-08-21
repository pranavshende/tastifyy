import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import Header from '../../components/customer/Header';
import RestaurantCard from '../../components/customer/RestaurantCard';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import EmptyState from '../../components/ui/EmptyState';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  city: string;
  cover_image_url: string;
  logo_url: string;
  is_pure_veg: boolean;
  cuisine_tags: string[];
  avg_preparation_time_mins: number;
  is_open: boolean;
  rating?: number;
}

export default function Restaurants() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isPureVegOnly, setIsPureVegOnly] = useState(false);
  const [isOpenOnly, setIsOpenOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        // Will try both endpoints since codebase had inconsistency
        let data;
        try {
          const response = await api.get('/customer/restaurants');
          data = response.data.data || response.data;
        } catch {
          const response = await api.get('/restaurants');
          data = response.data;
        }
        setRestaurants(data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to fetch restaurants');
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  // Sync search param to URL
  useEffect(() => {
    if (searchQuery) {
      setSearchParams({ search: searchQuery });
    } else {
      setSearchParams({});
    }
  }, [searchQuery, setSearchParams]);

  const categories = ['All', 'Biryani', 'Pizza', 'Burgers', 'Chinese', 'South Indian', 'Desserts'];

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.cuisine_tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesVeg = !isPureVegOnly || r.is_pure_veg;
    const matchesOpen = !isOpenOnly || r.is_open;
    const matchesCategory = activeCategory === 'All' || r.cuisine_tags.some(tag => tag.toLowerCase().includes(activeCategory.toLowerCase()));

    return matchesSearch && matchesVeg && matchesOpen && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-brand-light font-sans text-brand-dark flex flex-col pb-20">
      <Header location="Mumbai" showSearch={false} />

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
            
            {/* Search */}
            <div className="relative w-full md:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl leading-5 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all font-medium"
                placeholder="Search restaurants, cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              <div className="flex items-center gap-1.5 pr-2 border-r border-gray-200">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-bold text-gray-700">Filters:</span>
              </div>
              
              <button 
                onClick={() => setIsPureVegOnly(!isPureVegOnly)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors flex items-center gap-2 ${
                  isPureVegOnly ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className={`w-3 h-3 rounded-sm border ${isPureVegOnly ? 'border-green-600' : 'border-gray-400'} flex items-center justify-center`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isPureVegOnly ? 'bg-green-600' : 'bg-transparent'}`}></div>
                </div>
                Pure Veg
              </button>
              
              <button 
                onClick={() => setIsOpenOnly(!isOpenOnly)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                  isOpenOnly ? 'bg-brand-dark border-brand-dark text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Open Now
              </button>
            </div>

          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8 w-full">
        
        {/* Breadcrumb */}
        <div className="text-sm font-bold text-gray-500 mb-6 flex items-center gap-2">
          <a href="/customer/home" className="hover:text-brand-primary transition-colors">Home</a>
          <span>/</span>
          <span className="text-gray-900">Restaurants</span>
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-6 mb-2 scrollbar-hide snap-x">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`snap-start px-5 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === cat 
                  ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-primary hover:text-brand-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mb-6 flex items-baseline justify-between">
          <h1 className="text-2xl font-black text-gray-900">
            {searchQuery ? `Search results for "${searchQuery}"` : activeCategory !== 'All' ? `${activeCategory} Restaurants` : 'All Restaurants'}
          </h1>
          <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {filteredRestaurants.length} places
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <LoadingSkeleton type="restaurant" count={8} />
          </div>
        ) : error ? (
          <EmptyState 
            icon={<MapPin />}
            title="Unable to load restaurants"
            description={error}
            action={
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-secondary transition-colors"
              >
                Try Again
              </button>
            }
          />
        ) : filteredRestaurants.length === 0 ? (
          <EmptyState 
            icon={<Search />}
            title="No restaurants found"
            description="We couldn't find any places matching your current filters."
            action={
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setIsPureVegOnly(false);
                  setIsOpenOnly(false);
                  setActiveCategory('All');
                }}
                className="px-6 py-3 bg-white border-2 border-brand-primary text-brand-primary rounded-xl font-black hover:bg-brand-primary hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRestaurants.map(restaurant => (
              <RestaurantCard
                key={restaurant.id}
                id={restaurant.id}
                name={restaurant.name}
                coverImage={restaurant.cover_image_url}
                logo={restaurant.logo_url}
                cuisineTags={restaurant.cuisine_tags}
                isOpen={restaurant.is_open}
                isPureVeg={restaurant.is_pure_veg}
                city={restaurant.city}
                rating={restaurant.rating || 4.2}
                prepTime={restaurant.avg_preparation_time_mins}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
